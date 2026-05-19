'use strict';

/**
 * POST /admin/bookings/{id}/cancel
 *
 * Studio-side cancellation. Authenticated by an X-Admin-Secret header
 * matching the ADMIN_SECRET env var. Refund amount is an explicit input
 * from the caller — defaults to 0 (no refund). The studio can issue any
 * amount up to the booking's bundle total at its discretion.
 *
 * Body: {
 *   "refundCents": <int 0..amountCents>,  // optional, default 0
 *   "reason":      "<free text>"           // optional, stored for audit
 * }
 * The reason is not surfaced in student-facing emails — the student just
 * sees "cancelled by the studio".
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
    let refundCents = 0;
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (parsed && typeof parsed.reason === 'string') reason = parsed.reason.trim() || undefined;
        if (parsed && Number.isInteger(parsed.refundCents)) refundCents = parsed.refundCents;
      } catch {
        // Body wasn't JSON — ignore. Both fields optional; refund defaults to 0.
      }
    }
    if (refundCents < 0) {
      return badRequest('refundCents must be >= 0');
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

    if (refundCents > (booking.amountCents || 0)) {
      return badRequest(`refundCents ${refundCents} exceeds booking total ${booking.amountCents}`);
    }

    const { booking: updated } = await processCancellation({
      booking,
      refundAmountCents: refundCents,
      cancelledBy:       'studio',
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
