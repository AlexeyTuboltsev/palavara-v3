'use strict';

/**
 * POST /admin/bookings/{id}/cancel
 *
 * Studio-side cancellation. Authenticated by an X-Admin-Secret header
 * matching the ADMIN_SECRET env var. Always issues a full refund regardless
 * of how close to the workshop the cancellation happens — this is a
 * good-will override (sick teacher, weather, etc.).
 *
 * Optional body: {"reason": "<free text>"} stored on the booking row for
 * audit / inclusion in future reporting. Not surfaced in emails by design —
 * the student just sees "cancelled by the studio".
 */

const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');
const { processCancellation } = require('../utils/cancelLogic');
const crypto = require('crypto');

const TABLE        = process.env.BOOKINGS_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return badRequest('Invalid booking ID');
    }

    if (!ADMIN_SECRET) {
      console.warn('ADMIN_SECRET not configured — refusing all admin requests');
      return unauthorized();
    }
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    let reason;
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (parsed && typeof parsed.reason === 'string') reason = parsed.reason.trim() || undefined;
      } catch {
        // Body wasn't JSON — ignore. Reason is optional.
      }
    }

    const existing = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${id}` },
    }));

    if (!existing.Item) {
      return notFound('Booking not found');
    }

    const booking = existing.Item;

    if (booking.status === 'cancelled') {
      return ok(stripBooking(booking));
    }
    if (booking.status !== 'confirmed') {
      return badRequest(`Cannot cancel a booking with status "${booking.status}"`);
    }

    const { booking: updated } = await processCancellation({
      booking,
      alwaysRefund: true,
      cancelledBy:  'studio',
      reason,
    });

    return ok(stripBooking(updated));
  } catch (err) {
    console.error('adminCancelBooking error:', err);
    return serverError();
  }
};

function unauthorized() {
  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: 'Unauthorized' }),
  };
}

function timingSafeEq(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function stripBooking(item) {
  return {
    bookingId:           item.bookingId,
    date:                item.date,
    timeSlot:            item.timeSlot,
    slotEnd:             item.slotEnd,
    status:              item.status,
    bookingType:         item.bookingType || 'student',
    paymentMethod:       item.paymentMethod || 'paypal',
    paymentNote:         item.paymentNote,
    studentName:         item.studentName,
    studentEmail:        item.studentEmail,
    amountCents:         item.amountCents,
    refundedAmountCents: item.refundedAmountCents,
    paypalCaptureId:     item.paypalCaptureId,
    paypalRefundId:      item.paypalRefundId,
    cancelledAt:         item.cancelledAt,
    cancelledBy:         item.cancelledBy,
    cancellationReason:  item.cancellationReason,
    createdAt:           item.createdAt,
    confirmedAt:         item.confirmedAt,
  };
}
