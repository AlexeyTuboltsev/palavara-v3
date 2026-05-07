'use strict';

/**
 * POST /bookings
 *
 * Body (JSON): { date, start, studentName, studentEmail }
 *
 * 1. Validates input and that the slot exists for the chosen date.
 * 2. Confirms the slot is still free (best-effort — see TOCTOU note below).
 * 3. Creates a PayPal Order (Orders v2 REST, intent CAPTURE).
 * 4. Writes a `pending` booking to DynamoDB carrying the order id and the
 *    slot's start + end times.
 * 5. Returns { bookingId, approveUrl } — frontend redirects user to approveUrl.
 *
 * Note on race conditions: two concurrent requests for the same date+start
 * can both pass the availability query and both insert. For an MVP studio
 * with <5 bookings/day this is acceptable; switching to a SLOT#date#start PK
 * is the fix when concurrency matters.
 */

const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { findSlot, isValidDateString } = require('../utils/slots');
const { createOrder } = require('../utils/paypal');
const { v4: uuidv4 } = require('uuid');

const TABLE             = process.env.BOOKINGS_TABLE;
const PAYPAL_RETURN_URL = process.env.PAYPAL_RETURN_URL;
const PAYPAL_CANCEL_URL = process.env.PAYPAL_CANCEL_URL;
const PRICE_CENTS       = parseInt(process.env.PRICE_CENTS || '9500', 10);
const PRICE_CURRENCY    = process.env.PRICE_CURRENCY || 'EUR';

exports.handler = async (event) => {
  try {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const { date, start, studentName, studentEmail } = body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!date || !start || !studentName || !studentEmail) {
      return badRequest('Missing required fields: date, start, studentName, studentEmail');
    }
    if (!isValidDateString(date)) {
      return badRequest('Invalid date. Use YYYY-MM-DD format.');
    }

    const slot = findSlot(date, start);
    if (!slot) {
      return badRequest('No workshop slot at that date and start time.');
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
        ':slot': start,
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
      timeSlot:      slot.start,
      slotEnd:       slot.end,
      status:        'pending',
      bookingType:   'student',
      paymentMethod: 'paypal',
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
