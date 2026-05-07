'use strict';

/**
 * Shared cancellation logic — refund (if requested), atomic DB update,
 * email side-effects. Used by the student-facing /bookings/:id/cancel and
 * the admin-only /admin/bookings/:id/cancel handlers.
 *
 * Refund call is idempotent on PayPal's side (PayPal-Request-Id keyed by
 * bookingId), so a second cancellation attempt for the same booking returns
 * the same refund without double-refunding. The DB update is conditional on
 * status='confirmed' so it can only succeed once.
 */

const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('./dynamo');
const { refundCapture } = require('./paypal');
const {
  sendCancellationConfirmation,
  sendCancellationNotification,
} = require('./email');
const { deleteBookingEvent } = require('./googleCalendar');

const TABLE          = process.env.BOOKINGS_TABLE;
const PRICE_CURRENCY = process.env.PRICE_CURRENCY || 'EUR';

/** ms in 48 hours, the student-side refund cutoff. */
const REFUND_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Has the workshop start time passed our refund cutoff yet? */
function isRefundEligible(booking, nowMs = Date.now()) {
  if (!booking || !booking.date || !booking.timeSlot) return false;
  // Treat the slot start as Europe/Berlin local time. May 2026 is CEST (UTC+2),
  // but the slots in this MVP are all in May–October — we hardcode CEST. If
  // slots later span DST boundaries, switch to a proper IANA offset lookup.
  const local = `${booking.date}T${booking.timeSlot}:00+02:00`;
  const startMs = Date.parse(local);
  if (isNaN(startMs)) return false;
  return startMs - nowMs > REFUND_WINDOW_MS;
}

/**
 * Process a cancellation. Caller has already authenticated.
 *
 * @param {object} args
 * @param {object} args.booking      The current booking row (must be status=confirmed).
 * @param {boolean} args.alwaysRefund Admin path passes true; student path passes the result of isRefundEligible.
 * @param {'student'|'studio'} args.cancelledBy
 * @param {string=} args.reason       Optional free-text reason (used for studio cancellations).
 * @returns {Promise<object>}        The updated booking attributes.
 */
async function processCancellation({ booking, alwaysRefund, cancelledBy, reason }) {
  let refundedAmountCents = 0;
  let paypalRefundId = '';

  // Only refund through PayPal if the caller asked AND the booking was paid
  // via PayPal in the first place AND it has an actual capture id. Manual /
  // comp / held bookings have no capture; the owner reverses any out-of-band
  // payment themselves.
  const paymentMethod = booking.paymentMethod || 'paypal';
  const refundable = alwaysRefund && paymentMethod === 'paypal' && booking.paypalCaptureId;

  if (refundable) {
    const r = await refundCapture({
      captureId:   booking.paypalCaptureId,
      amountCents: booking.amountCents,
      currency:    PRICE_CURRENCY,
      bookingId:   booking.bookingId,
    });
    if (r.status !== 'COMPLETED' && r.status !== 'PENDING') {
      throw new Error(`PayPal refund returned unexpected status: ${r.status}`);
    }
    refundedAmountCents = booking.amountCents;
    paypalRefundId      = r.refundId;
  }

  const now = new Date().toISOString();

  let updated;
  try {
    const result = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${booking.bookingId}` },
      UpdateExpression: [
        'SET #s = :cancelled',
        'cancelledAt = :now',
        'cancelledBy = :by',
        'refundedAmountCents = :refunded',
        'paypalRefundId = :refundId',
        ...(reason ? ['cancellationReason = :reason'] : []),
      ].join(', '),
      ConditionExpression: '#s = :confirmed',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':cancelled': 'cancelled',
        ':confirmed': 'confirmed',
        ':now':       now,
        ':by':        cancelledBy,
        ':refunded':  refundedAmountCents,
        ':refundId':  paypalRefundId,
        ...(reason ? { ':reason': reason } : {}),
      },
      ReturnValues: 'ALL_NEW',
    }));
    updated = result.Attributes;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Someone else cancelled (admin overrode after student?, double-click).
      // Refetch and return whatever's there. Don't re-send emails.
      const refetch = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `BOOKING#${booking.bookingId}` },
      }));
      return { booking: refetch.Item, alreadyCancelled: true };
    }
    throw err;
  }

  // Best-effort side-effects. Failures log only; cancellation itself is
  // the source of truth in DynamoDB.
  await Promise.all([
    sendCancellationConfirmation(updated),
    sendCancellationNotification(updated),
    deleteBookingEvent(updated).catch((e) => {
      console.error('googleCalendar delete failed', { bookingId: updated.bookingId, error: e?.message || e });
    }),
  ]);

  return { booking: updated, alreadyCancelled: false };
}

module.exports = { processCancellation, isRefundEligible, REFUND_WINDOW_MS };
