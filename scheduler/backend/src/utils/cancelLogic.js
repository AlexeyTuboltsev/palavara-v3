'use strict';

/**
 * Shared cancellation logic — refund (if requested), atomic DB update,
 * email side-effects. Used by the student-facing /bookings/:id/cancel and
 * the admin-only /admin/bookings/:id/cancel handlers.
 *
 * Single-session refund window: 48 h before the slot.
 * 4-session cycle refund window: 7 days before the EARLIEST session.
 * Cancellation of a cycle cancels all sibling rows atomically and issues
 * a single PayPal refund for the bundle.
 *
 * Refund call is idempotent on PayPal's side (PayPal-Request-Id keyed by
 * bookingId for singles, or cycleId for cycles), so a second cancellation
 * attempt returns the same refund without double-refunding. The DB update
 * is conditional on status='confirmed' so it can only succeed once.
 */

const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('./dynamo');
const { refundCapture } = require('./paypal');
const {
  sendCancellationConfirmation,
  sendCancellationNotification,
  sendCycleCancellationConfirmation,
  sendCycleCancellationNotification,
} = require('../email');
const { deleteBookingEvent } = require('./googleCalendar');
const { findCycleSiblings, transactUpdateAll } = require('./cycleLogic');

const TABLE          = process.env.BOOKINGS_TABLE;
const PRICE_CURRENCY = process.env.PRICE_CURRENCY || 'EUR';

/** Single-session refund cutoff. */
const SINGLE_REFUND_WINDOW_MS = 48 * 60 * 60 * 1000;

/** 4-session cycle refund cutoff (measured from earliest session). */
const CYCLE_REFUND_WINDOW_MS  = 7 * 24 * 60 * 60 * 1000;

/**
 * Parse a slot start (Europe/Berlin local time) into ms since epoch.
 * May 2026 is CEST (UTC+2); we hardcode it for now — see the original
 * note in this file before refactor. If slots later span DST boundaries
 * switch to a proper IANA offset lookup.
 */
function slotStartMs(date, timeSlot) {
  if (!date) return NaN;
  const local = `${date}T${timeSlot || '00:00'}:00+02:00`;
  return Date.parse(local);
}

/**
 * Compute refund eligibility. For a cycle, eligibility is measured against
 * the earliest session — once any session is within 7 days, the whole
 * bundle is past the refund window.
 *
 * @param {object} booking   The booking row the user is acting on.
 * @param {Array<object>=} cycleSiblings  Pre-fetched cycle rows (incl. `booking`).
 *                                        Required when booking.cycleId is set.
 * @param {number=} nowMs
 */
function isRefundEligible(booking, cycleSiblings, nowMs = Date.now()) {
  if (!booking || !booking.date) return false;

  if (booking.cycleId) {
    if (!Array.isArray(cycleSiblings) || cycleSiblings.length === 0) {
      // Caller forgot to load siblings — be conservative.
      return false;
    }
    let earliest = Infinity;
    for (const row of cycleSiblings) {
      const ms = slotStartMs(row.date, row.timeSlot);
      if (!isNaN(ms) && ms < earliest) earliest = ms;
    }
    if (!isFinite(earliest)) return false;
    return earliest - nowMs > CYCLE_REFUND_WINDOW_MS;
  }

  const startMs = slotStartMs(booking.date, booking.timeSlot);
  if (isNaN(startMs)) return false;
  return startMs - nowMs > SINGLE_REFUND_WINDOW_MS;
}

/**
 * Process a cancellation. Caller has already authenticated.
 *
 * For cycle bookings: cancels all sibling rows in a single transaction,
 * issues exactly one PayPal refund (the captureId is the same across
 * siblings; the bundle's amountCents is denormalised onto every row).
 *
 * @param {object} args
 * @param {object} args.booking      The row the user acted on (must be confirmed).
 * @param {boolean} args.alwaysRefund Admin path passes true; student path passes the result of isRefundEligible.
 * @param {'student'|'studio'} args.cancelledBy
 * @param {string=} args.reason       Optional free-text reason (used for studio cancellations).
 * @returns {Promise<{booking: object, alreadyCancelled: boolean}>}
 */
async function processCancellation({ booking, alwaysRefund, cancelledBy, reason }) {
  const isCycle = !!booking.cycleId;
  const siblings = isCycle ? await findCycleSiblings(booking.cycleId) : [booking];

  let refundedAmountCents = 0;
  let paypalRefundId      = '';

  const paymentMethod = booking.paymentMethod || 'paypal';
  const refundable = alwaysRefund && paymentMethod === 'paypal' && booking.paypalCaptureId;

  if (refundable) {
    // Bundle total is denormalised onto every row, so we just take it
    // from `booking`. PayPal-Request-Id is keyed by cycleId for cycles
    // (single shared refund) or bookingId for singles — keeps the refund
    // idempotent across retries.
    const r = await refundCapture({
      captureId:   booking.paypalCaptureId,
      amountCents: booking.amountCents,
      currency:    PRICE_CURRENCY,
      bookingId:   isCycle ? `cycle-${booking.cycleId}` : booking.bookingId,
    });
    if (r.status !== 'COMPLETED' && r.status !== 'PENDING') {
      throw new Error(`PayPal refund returned unexpected status: ${r.status}`);
    }
    refundedAmountCents = booking.amountCents;
    paypalRefundId      = r.refundId;
  }

  const now = new Date().toISOString();

  // Build the SET clause once — the same fields update on every sibling.
  const setClauses = [
    '#s = :cancelled',
    'cancelledAt = :now',
    'cancelledBy = :by',
    'refundedAmountCents = :refunded',
    'paypalRefundId = :refundId',
  ];
  if (reason) setClauses.push('cancellationReason = :reason');
  const updateExpression = 'SET ' + setClauses.join(', ');

  const expressionAttributeNames  = { '#s': 'status' };
  const expressionAttributeValues = {
    ':cancelled': 'cancelled',
    ':confirmed': 'confirmed',
    ':now':       now,
    ':by':        cancelledBy,
    ':refunded':  refundedAmountCents,
    ':refundId':  paypalRefundId,
    ...(reason ? { ':reason': reason } : {}),
  };
  const conditionExpression = '#s = :confirmed';

  if (isCycle) {
    try {
      await transactUpdateAll(siblings, {
        updateExpression,
        conditionExpression,
        expressionAttributeNames,
        expressionAttributeValues,
      });
    } catch (err) {
      if (err.name === 'TransactionCanceledException') {
        // At least one sibling wasn't confirmed (likely already cancelled).
        // Refetch and bail — don't re-email.
        const refetch = await ddb.send(new GetCommand({
          TableName: TABLE,
          Key: { PK: `BOOKING#${booking.bookingId}` },
        }));
        return { booking: refetch.Item, alreadyCancelled: true };
      }
      throw err;
    }
    // Refetch the now-cancelled siblings so the email senders see the
    // updated refund + cancellation fields.
    const cancelledSiblings = await findCycleSiblings(booking.cycleId);
    const refetched = cancelledSiblings.find((s) => s.bookingId === booking.bookingId);

    await Promise.all([
      sendCycleCancellationConfirmation(cancelledSiblings),
      sendCycleCancellationNotification(cancelledSiblings),
      ...cancelledSiblings.map((s) =>
        deleteBookingEvent(s).catch((e) => {
          console.error('googleCalendar delete failed', { bookingId: s.bookingId, error: e?.message || e });
        })
      ),
    ]);

    return { booking: refetched, alreadyCancelled: false };
  }

  // Single-session path
  let updated;
  try {
    const result = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${booking.bookingId}` },
      UpdateExpression: updateExpression,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));
    updated = result.Attributes;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      const refetch = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `BOOKING#${booking.bookingId}` },
      }));
      return { booking: refetch.Item, alreadyCancelled: true };
    }
    throw err;
  }

  await Promise.all([
    sendCancellationConfirmation(updated),
    sendCancellationNotification(updated),
    deleteBookingEvent(updated).catch((e) => {
      console.error('googleCalendar delete failed', { bookingId: updated.bookingId, error: e?.message || e });
    }),
  ]);

  return { booking: updated, alreadyCancelled: false };
}

module.exports = {
  processCancellation,
  isRefundEligible,
  SINGLE_REFUND_WINDOW_MS,
  CYCLE_REFUND_WINDOW_MS,
};
