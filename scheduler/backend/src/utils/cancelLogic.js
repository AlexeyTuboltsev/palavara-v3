'use strict';

/**
 * Shared cancellation logic — refund (if requested), atomic DB update,
 * email side-effects. Used by the student-facing /bookings/:id/cancel and
 * the admin-only /admin/bookings/:id/cancel handlers.
 *
 * Refund policy (same for singles and cycles): full refund if the
 * cancellation happens at least 7 calendar days before the session
 * (the earliest session, for cycles). Calendar-day arithmetic — a
 * session on day D is refundable any time on day D-7 or earlier.
 *
 * Reschedule policy: up to 3 calendar days before the session. Not
 * enforced by code today (reschedules are handled manually via email);
 * the constant is exported so copy can stay in lockstep.
 *
 * Cancellation of a cycle cancels all sibling rows atomically and issues
 * a single PayPal refund for the bundle. Refund call is idempotent on
 * PayPal's side (PayPal-Request-Id keyed by bookingId for singles, or
 * cycleId for cycles). The DB update is conditional on status='confirmed'
 * so it can only succeed once.
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

const REFUND_WINDOW_DAYS     = 7;
const RESCHEDULE_WINDOW_DAYS = 3;

/**
 * Calendar-day diff between "today in Europe/Berlin" and a YYYY-MM-DD
 * session date. Returns sessionDate - today in whole days, ignoring
 * time-of-day. So a session on 2026-05-25 from "today" 2026-05-18
 * returns 7 — eligible right up until end-of-day on the 18th.
 */
function daysUntilSessionDate(dateYmd, nowMs = Date.now()) {
  if (!dateYmd) return NaN;
  const [y, m, d] = dateYmd.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  const sessionUtcMidnight = Date.UTC(y, m - 1, d);
  const todayYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date(nowMs));
  const [ty, tm, td] = todayYmd.split('-').map(Number);
  const todayUtcMidnight = Date.UTC(ty, tm - 1, td);
  return Math.round((sessionUtcMidnight - todayUtcMidnight) / 86_400_000);
}

/**
 * Compute refund eligibility. For a cycle, eligibility is measured against
 * the earliest session — once any session is within REFUND_WINDOW_DAYS, the
 * whole bundle is past the refund window.
 *
 * @param {object} booking   The booking row the user is acting on.
 * @param {Array<object>=} cycleSiblings  Pre-fetched cycle rows (incl. `booking`).
 *                                        Required when booking.cycleId is set.
 * @param {number=} nowMs
 */
function isRefundEligible(booking, cycleSiblings, nowMs = Date.now()) {
  if (!booking || !booking.date) return false;

  let targetDate = booking.date;
  if (booking.cycleId) {
    if (!Array.isArray(cycleSiblings) || cycleSiblings.length === 0) {
      return false;
    }
    // YYYY-MM-DD sorts lexicographically the same as chronologically.
    targetDate = cycleSiblings
      .map((s) => s.date)
      .filter(Boolean)
      .sort()[0];
    if (!targetDate) return false;
  }

  return daysUntilSessionDate(targetDate, nowMs) >= REFUND_WINDOW_DAYS;
}

/**
 * Process a cancellation. Caller has already authenticated and decided
 * how much to refund. The refund amount is an explicit input — there is
 * no implicit "full refund" anymore. Student handler computes it from
 * the 7-day rule (full or zero); admin handler reads it from the request
 * body so the studio can issue partial / zero / full refunds at will.
 *
 * For cycle bookings: cancels all sibling rows in a single transaction,
 * issues at most one PayPal refund (the captureId is the same across
 * siblings; the bundle's amountCents is denormalised onto every row).
 *
 * @param {object} args
 * @param {object} args.booking            The row the user acted on (must be confirmed).
 * @param {number} args.refundAmountCents  Integer cents to refund. 0 = no refund.
 *                                          Must be 0 <= n <= booking.amountCents.
 * @param {'student'|'studio'} args.cancelledBy
 * @param {string=} args.reason            Optional free-text reason (used for studio cancellations).
 * @returns {Promise<{booking: object, alreadyCancelled: boolean}>}
 */
async function processCancellation({ booking, refundAmountCents, cancelledBy, reason }) {
  const isCycle = !!booking.cycleId;
  const siblings = isCycle ? await findCycleSiblings(booking.cycleId) : [booking];

  const requested = Number.isInteger(refundAmountCents) ? refundAmountCents : 0;
  const bundleTotal = booking.amountCents || 0;
  if (requested < 0 || requested > bundleTotal) {
    throw new Error(`refundAmountCents ${requested} out of range [0..${bundleTotal}]`);
  }

  let refundedAmountCents = 0;
  let paypalRefundId      = '';

  const paymentMethod = booking.paymentMethod || 'paypal';
  const refundable = requested > 0 && paymentMethod === 'paypal' && booking.paypalCaptureId;

  if (refundable) {
    // PayPal-Request-Id is keyed by cycleId for cycles (single shared refund)
    // or bookingId for singles — keeps the refund idempotent across retries.
    // PayPal accepts partial refunds against a capture as long as the cumulative
    // refunded amount doesn't exceed the captured amount.
    const r = await refundCapture({
      captureId:   booking.paypalCaptureId,
      amountCents: requested,
      currency:    PRICE_CURRENCY,
      bookingId:   isCycle ? `cycle-${booking.cycleId}` : booking.bookingId,
    });
    if (r.status !== 'COMPLETED' && r.status !== 'PENDING') {
      throw new Error(`PayPal refund returned unexpected status: ${r.status}`);
    }
    refundedAmountCents = requested;
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
  daysUntilSessionDate,
  REFUND_WINDOW_DAYS,
  RESCHEDULE_WINDOW_DAYS,
};
