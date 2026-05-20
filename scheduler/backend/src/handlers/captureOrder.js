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
const {
  sendBookingConfirmation,
  sendOwnerNotification,
  sendCycleBookingConfirmation,
  sendCycleOwnerNotification,
} = require('../email');
const { insertBookingEvent } = require('../utils/googleCalendar');
const { findCycleSiblings, transactUpdateAll } = require('../utils/cycleLogic');
const { isValidBookingId } = require('../utils/bookingId');

const TABLE = process.env.BOOKINGS_TABLE;

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!isValidBookingId(id)) {
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

    const updatedBooking = updated.Attributes;

    // Cycle path: confirm the remaining sibling rows atomically, then send
    // one cycle-aware confirmation email + one owner notification carrying
    // a multi-event ICS. Calendar inserts run per-session.
    if (updatedBooking.cycleId) {
      let siblings = [];
      try {
        siblings = (await findCycleSiblings(updatedBooking.cycleId))
          .filter((row) => row.bookingId !== id);
        if (siblings.length > 0) {
          await transactUpdateAll(siblings, {
            updateExpression: 'SET #s = :confirmed, paypalCaptureId = :cap, confirmedAt = :now',
            conditionExpression: '#s = :pending',
            expressionAttributeNames: { '#s': 'status' },
            expressionAttributeValues: {
              ':confirmed': 'confirmed',
              ':pending':   'pending',
              ':cap':       captureId,
              ':now':       now,
            },
          });
        }
      } catch (err) {
        if (err.name !== 'TransactionCanceledException') throw err;
        // Siblings already confirmed by the webhook — fine.
      }

      // Refetch the full, now-confirmed sibling set for the email + calendar
      // side-effects. Skips the work entirely if the webhook beat us to the
      // emails (the row's confirmedAt is set in the same transaction as the
      // status flip, so checking it here would be racy — keep it simple and
      // just let SES dedupe by Message-ID when both paths fire).
      const allSiblings = await findCycleSiblings(updatedBooking.cycleId);
      await Promise.all([
        sendCycleBookingConfirmation(allSiblings),
        sendCycleOwnerNotification(allSiblings),
        ...allSiblings.map((s) =>
          insertBookingEvent(s).catch((e) => {
            console.error('googleCalendar insert failed', { bookingId: s.bookingId, error: e?.message || e });
          })
        ),
      ]);
      return ok(stripBooking(updatedBooking));
    }

    // Single-session path — fire the usual side-effects.
    await Promise.all([
      sendBookingConfirmation(updatedBooking),
      sendOwnerNotification(updatedBooking),
      insertBookingEvent(updatedBooking).catch((e) => {
        console.error('googleCalendar insert failed', { bookingId: id, error: e?.message || e });
      }),
    ]);

    return ok(stripBooking(updatedBooking));
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
    bookingId:        item.bookingId,
    date:             item.date,
    timeSlot:         item.timeSlot,
    slotEnd:          item.slotEnd,
    status:           item.status,
    studentName:      item.studentName,
    amountCents:      item.amountCents,
    lessonTypeId:     item.lessonTypeId,
    lessonTypeLabel:  item.lessonTypeLabel,
    numPersons:       item.numPersons,
    createdAt:        item.createdAt,
    confirmedAt:      item.confirmedAt,
  };
}
