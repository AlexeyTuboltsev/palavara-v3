'use strict';

/**
 * GET /availability?date=YYYY-MM-DD
 *
 * Returns the list of available 1-hour slots for the given date.
 * All 12 slots (10:00–21:00) minus any slots that already have a
 * booking in status "pending" or "confirmed".
 */

const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { ALL_SLOTS, isValidFutureDate } = require('../utils/slots');

const TABLE = process.env.BOOKINGS_TABLE;

exports.handler = async (event) => {
  try {
    const date = event.queryStringParameters?.date;

    if (!date) {
      return badRequest('Missing required query parameter: date');
    }
    if (!isValidFutureDate(date)) {
      return badRequest('Invalid or past date. Use YYYY-MM-DD format.');
    }

    // Query the GSI date-index for all bookings on this date
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date',
      FilterExpression: '#s IN (:pending, :confirmed)',
      ExpressionAttributeNames: {
        '#d': 'date',
        '#s': 'status',
      },
      ExpressionAttributeValues: {
        ':date': date,
        ':pending': 'pending',
        ':confirmed': 'confirmed',
      },
      ProjectionExpression: 'timeSlot',
    }));

    const bookedSlots = new Set((result.Items || []).map((item) => item.timeSlot));
    const availableSlots = ALL_SLOTS.filter((slot) => !bookedSlots.has(slot));

    return ok({
      date,
      availableSlots,
      totalSlots: ALL_SLOTS.length,
      bookedCount: bookedSlots.size,
    });
  } catch (err) {
    console.error('getAvailability error:', err);
    return serverError();
  }
};
