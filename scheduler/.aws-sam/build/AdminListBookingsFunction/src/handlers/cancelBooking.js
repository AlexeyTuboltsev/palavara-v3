'use strict';

/**
 * POST /bookings/{id}/cancel?token=<sig>
 *
 * Student-facing cancellation. The token in the query string is a HMAC bound
 * to the booking id (set in the confirmation email). Refund is full only if
 * the cancellation is more than 48 hours before the workshop start.
 *
 * Idempotent: a second call after a successful cancellation refetches the
 * cancelled row and returns it without re-refunding or re-emailing.
 */

const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');
const { verifyCancelToken } = require('../utils/cancelToken');
const { processCancellation, isRefundEligible } = require('../utils/cancelLogic');

const TABLE = process.env.BOOKINGS_TABLE;

exports.handler = async (event) => {
  try {
    const id    = event.pathParameters?.id;
    const token = event.queryStringParameters?.token;

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return badRequest('Invalid booking ID');
    }
    if (!verifyCancelToken(id, token)) {
      return badRequest('Invalid or missing cancellation token');
    }

    const existing = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${id}` },
    }));

    if (!existing.Item) {
      return notFound('Booking not found');
    }

    const booking = existing.Item;

    // Idempotency: if already cancelled, return the cancelled row unchanged.
    if (booking.status === 'cancelled') {
      return ok(stripBooking(booking));
    }

    if (booking.status !== 'confirmed') {
      return badRequest(`Cannot cancel a booking with status "${booking.status}"`);
    }

    const eligible = isRefundEligible(booking);

    const { booking: updated } = await processCancellation({
      booking,
      alwaysRefund: eligible,
      cancelledBy:  'student',
    });

    return ok(stripBooking(updated));
  } catch (err) {
    console.error('cancelBooking error:', err);
    return serverError();
  }
};

function stripBooking(item) {
  return {
    bookingId:           item.bookingId,
    date:                item.date,
    timeSlot:            item.timeSlot,
    slotEnd:             item.slotEnd,
    status:              item.status,
    studentName:         item.studentName,
    amountCents:         item.amountCents,
    cancelledAt:         item.cancelledAt,
    cancelledBy:         item.cancelledBy,
    refundedAmountCents: item.refundedAmountCents,
  };
}
