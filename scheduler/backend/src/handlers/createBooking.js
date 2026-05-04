'use strict';

/**
 * POST /bookings
 *
 * Body (JSON): { date, timeSlot, studentName, studentEmail }
 *
 * 1. Validates input.
 * 2. Confirms the slot is still free (best-effort — see TOCTOU note below).
 * 3. Creates a PayPal Order (Orders v2 REST, intent CAPTURE).
 * 4. Writes a `pending` booking to DynamoDB carrying the order id.
 * 5. Returns { bookingId, approveUrl } — frontend redirects user to approveUrl.
 *
 * Note on race conditions: two concurrent requests for the same date+timeSlot
 * can both pass the availability query and both insert. For an MVP studio with
 * <5 bookings/day this is acceptable; switching to a SLOT#date#time PK is the
 * fix when concurrency matters.
 */

const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { ALL_SLOTS, isValidFutureDate } = require('../utils/slots');
const { createOrder } = require('../utils/paypal');
const { v4: uuidv4 } = require('uuid');

const TABLE             = process.env.BOOKINGS_TABLE;
const PAYPAL_RETURN_URL = process.env.PAYPAL_RETURN_URL;
const PAYPAL_CANCEL_URL = process.env.PAYPAL_CANCEL_URL;
const PRICE_CENTS       = parseInt(process.env.PRICE_CENTS || '2000', 10);
const PRICE_CURRENCY    = process.env.PRICE_CURRENCY || 'EUR';

exports.handler = async (event) => {
  try {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const { date, timeSlot, studentName, studentEmail } = body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!date || !timeSlot || !studentName || !studentEmail) {
      return badRequest('Missing required fields: date, timeSlot, studentName, studentEmail');
    }
    if (!isValidFutureDate(date)) {
      return badRequest('Invalid or past date');
    }
    if (!ALL_SLOTS.includes(timeSlot)) {
      return badRequest(`Invalid timeSlot. Must be one of: ${ALL_SLOTS.join(', ')}`);
    }
    if (!studentEmail.includes('@')) {
      return badRequest('Invalid email address');
    }
    if (studentName.trim().length < 2) {
      return badRequest('Name must be at least 2 characters');
    }

    // ── Check slot availability ──────────────────────────────────────────────
    const existing = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date AND #t = :slot',
      FilterExpression: '#s IN (:pending, :confirmed)',
      ExpressionAttributeNames: { '#d': 'date', '#t': 'timeSlot', '#s': 'status' },
      ExpressionAttributeValues: {
        ':date': date,
        ':slot': timeSlot,
        ':pending': 'pending',
        ':confirmed': 'confirmed',
      },
      Limit: 1,
    }));

    if ((existing.Items || []).length > 0) {
      return badRequest('This time slot is no longer available. Please choose another.');
    }

    // ── Allocate booking id and create PayPal order ──────────────────────────
    const bookingId = uuidv4();

    const returnUrl = appendQuery(PAYPAL_RETURN_URL, { bookingId });
    const cancelUrl = appendQuery(PAYPAL_CANCEL_URL, { bookingId });

    const { orderId, approveUrl } = await createOrder({
      bookingId,
      amountCents: PRICE_CENTS,
      currency:    PRICE_CURRENCY,
      returnUrl,
      cancelUrl,
    });

    // ── Persist booking ──────────────────────────────────────────────────────
    const now = new Date().toISOString();
    const item = {
      PK:            `BOOKING#${bookingId}`,
      bookingId,
      date,
      timeSlot,
      status:        'pending',
      studentName:   studentName.trim(),
      studentEmail:  studentEmail.trim().toLowerCase(),
      paypalOrderId: orderId,
      amountCents:   PRICE_CENTS,
      createdAt:     now,
    };

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    return ok({ bookingId, approveUrl });
  } catch (err) {
    console.error('createBooking error:', err);
    return serverError();
  }
};

function appendQuery(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}
