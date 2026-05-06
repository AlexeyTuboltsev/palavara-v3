'use strict';

/**
 * GET /availability?date=YYYY-MM-DD
 *
 * Returns the workshop slots configured for the given date that have not
 * yet been booked. Each slot is returned as { start, end } with times in
 * Europe/Berlin local time.
 *
 * Past dates and dates with no workshops yield an empty list (not an error).
 */

const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { getSlotsForDate, isValidDateString } = require('../utils/slots');

const TABLE = process.env.BOOKINGS_TABLE;

exports.handler = async (event) => {
  try {
    const date = event.queryStringParameters?.date;

    if (!date) {
      return badRequest('Missing required query parameter: date');
    }
    if (!isValidDateString(date)) {
      return badRequest('Invalid date. Use YYYY-MM-DD format.');
    }

    const allSlots = getSlotsForDate(date);

    if (allSlots.length === 0) {
      // Past date, no workshops, or unknown date — return empty list cleanly.
      return ok({ date, availableSlots: [], totalSlots: 0, bookedCount: 0 });
    }

    // The GSI's range key is timeSlot (the slot's start time).
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date',
      FilterExpression: '#s IN (:pending, :confirmed)',
      ExpressionAttributeNames: { '#d': 'date', '#s': 'status' },
      ExpressionAttributeValues: {
        ':date': date,
        ':pending': 'pending',
        ':confirmed': 'confirmed',
      },
      ProjectionExpression: 'timeSlot',
    }));

    const bookedStarts = new Set((result.Items || []).map((item) => item.timeSlot));
    const availableSlots = allSlots.filter((s) => !bookedStarts.has(s.start));

    return ok({
      date,
      availableSlots,
      totalSlots: allSlots.length,
      bookedCount: bookedStarts.size,
    });
  } catch (err) {
    console.error('getAvailability error:', err);
    return serverError();
  }
};
