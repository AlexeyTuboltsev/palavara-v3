'use strict';

/**
 * GET /bookings/{id}
 *
 * Returns the current status of a booking.
 * Used by the confirmation page to poll until status = "confirmed".
 *
 * For cycle bookings (rows that carry a cycleId), the response also
 * includes a `cycleSiblings: [{sessionIndex, date, timeSlot, slotEnd,
 * bookingId, status}, ...]` array so the confirm page can render all
 * sessions in one round-trip.
 */

const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');
const { findCycleSiblings } = require('../utils/cycleLogic');

const TABLE = process.env.BOOKINGS_TABLE;

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return badRequest('Invalid booking ID');
    }

    const result = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${id}` },
      ProjectionExpression:
        'bookingId, #d, timeSlot, slotEnd, #s, studentName, amountCents, '
        + 'lessonTypeId, lessonTypeLabel, numPersons, createdAt, confirmedAt, '
        + 'cycleId, sessionIndex, sessionCount',
      ExpressionAttributeNames: {
        '#d': 'date',
        '#s': 'status',
      },
    }));

    if (!result.Item) {
      return notFound('Booking not found');
    }

    const item = result.Item;

    // Inline the cycle siblings so the confirm page can render all
    // sessions without a second round-trip. Each sibling carries only
    // the per-session fields the UI needs.
    if (item.cycleId) {
      const siblings = await findCycleSiblings(item.cycleId);
      item.cycleSiblings = siblings
        .map((row) => ({
          bookingId:    row.bookingId,
          sessionIndex: row.sessionIndex,
          date:         row.date,
          timeSlot:     row.timeSlot,
          slotEnd:      row.slotEnd,
          status:       row.status,
        }))
        .sort((a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0));
    }

    return ok(item);
  } catch (err) {
    console.error('getBooking error:', err);
    return serverError();
  }
};
