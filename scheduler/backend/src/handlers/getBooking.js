'use strict';

/**
 * GET /bookings/{id}
 *
 * Returns the current status of a booking.
 * Used by the confirmation page to poll until status = "confirmed".
 */

const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');

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
        'bookingId, #d, timeSlot, slotEnd, #s, studentName, amountCents, createdAt, confirmedAt',
      ExpressionAttributeNames: {
        '#d': 'date',
        '#s': 'status',
      },
    }));

    if (!result.Item) {
      return notFound('Booking not found');
    }

    return ok(result.Item);
  } catch (err) {
    console.error('getBooking error:', err);
    return serverError();
  }
};
