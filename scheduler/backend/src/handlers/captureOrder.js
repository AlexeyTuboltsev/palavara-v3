'use strict';

/**
 * POST /bookings/{id}/capture
 *
 * Called by the confirmation page after PayPal redirects the user back.
 *
 *  1. Look up the booking; require status === 'pending'.
 *  2. Call PayPal's capture endpoint on the stored orderId.
 *  3. On COMPLETED, flip booking status to 'confirmed', store capture id
 *     and confirmedAt. Idempotent: a second call on a confirmed booking
 *     returns the booking unchanged with 200.
 *
 * The webhook handler also confirms bookings as a backup, so this endpoint
 * is non-essential for correctness — but it gives the user a synchronous
 * "Your booking is confirmed" response instead of relying on polling.
 */

const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');
const { captureOrder } = require('../utils/paypal');
const { sendBookingConfirmation, sendOwnerNotification } = require('../utils/email');

const TABLE = process.env.BOOKINGS_TABLE;

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return badRequest('Invalid booking ID');
    }

    const existing = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${id}` },
    }));

    if (!existing.Item) {
      return notFound('Booking not found');
    }

    const booking = existing.Item;

    // Idempotency: if the webhook (or a previous capture call) already
    // confirmed this booking, just return success.
    if (booking.status === 'confirmed') {
      return ok(stripBooking(booking));
    }

    if (booking.status !== 'pending') {
      return badRequest(`Cannot capture a booking with status "${booking.status}"`);
    }

    if (!booking.paypalOrderId) {
      return badRequest('Booking has no associated PayPal order');
    }

    const { status, captureId } = await captureOrder(booking.paypalOrderId);

    if (status !== 'COMPLETED') {
      console.warn('Capture not COMPLETED', { bookingId: id, status });
      return badRequest(`Payment not completed (status: ${status})`);
    }

    const now = new Date().toISOString();
    const updated = await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${id}` },
      UpdateExpression: 'SET #s = :confirmed, paypalCaptureId = :cap, confirmedAt = :now',
      ConditionExpression: '#s = :pending',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':confirmed': 'confirmed',
        ':pending':   'pending',
        ':cap':       captureId,
        ':now':       now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    // We won the conditional flip — send both confirmation emails (student
    // + owner). Failures log only; we never roll back a booking because of
    // email trouble. Run in parallel since they're independent.
    await Promise.all([
      sendBookingConfirmation(updated.Attributes),
      sendOwnerNotification(updated.Attributes),
    ]);

    return ok(stripBooking(updated.Attributes));
  } catch (err) {
    console.error('captureOrder error:', err);
    // ConditionalCheckFailedException = the webhook beat us to it.
    if (err.name === 'ConditionalCheckFailedException') {
      const refetch = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `BOOKING#${event.pathParameters?.id}` },
      }));
      if (refetch.Item?.status === 'confirmed') {
        return ok(stripBooking(refetch.Item));
      }
    }
    return serverError();
  }
};

function stripBooking(item) {
  return {
    bookingId:    item.bookingId,
    date:         item.date,
    timeSlot:     item.timeSlot,
    slotEnd:      item.slotEnd,
    status:       item.status,
    studentName:  item.studentName,
    amountCents:  item.amountCents,
    createdAt:    item.createdAt,
    confirmedAt:  item.confirmedAt,
  };
}
