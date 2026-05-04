'use strict';

/**
 * POST /bookings
 *
 * Body (JSON):
 *   { date, timeSlot, studentName, studentEmail }
 *
 * 1. Validates the slot is still available (race condition guard via
 *    a conditional write — DynamoDB will reject a duplicate date+slot).
 * 2. Writes a "pending" booking to DynamoDB.
 * 3. Returns a PayPal Standard Checkout redirect URL.
 *
 * The frontend immediately redirects the user to that URL.
 */

const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { ALL_SLOTS, isValidFutureDate } = require('../utils/slots');
const { v4: uuidv4 } = require('uuid');

const TABLE = process.env.BOOKINGS_TABLE;
const PAYPAL_CLIENT_ID   = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_MODE        = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_RETURN_URL  = process.env.PAYPAL_RETURN_URL;
const PAYPAL_CANCEL_URL  = process.env.PAYPAL_CANCEL_URL;
const PRICE_CENTS        = parseInt(process.env.PRICE_CENTS || '2000', 10);
const PRICE_CURRENCY     = process.env.PRICE_CURRENCY || 'EUR';

const PAYPAL_BASE = PAYPAL_MODE === 'live'
  ? 'https://www.paypal.com'
  : 'https://www.sandbox.paypal.com';

/** Build the PayPal Standard Checkout redirect URL (no SDK needed). */
function buildPayPalUrl(bookingId, amount, currency, returnUrl, cancelUrl) {
  const price = (amount / 100).toFixed(2);
  const notifyUrl = process.env.PAYPAL_NOTIFY_URL || ''; // filled in by API GW output

  const params = new URLSearchParams({
    cmd: '_xclick',
    business: PAYPAL_CLIENT_ID,   // For sandbox: use your sandbox business email OR client ID
    item_name: `Palavara Lesson — booking ${bookingId}`,
    item_number: bookingId,
    amount: price,
    currency_code: currency,
    return: returnUrl,
    cancel_return: cancelUrl,
    notify_url: notifyUrl,
    no_shipping: '1',
    no_note: '1',
    charset: 'utf-8',
    custom: bookingId,            // echoed back in IPN
  });

  return `${PAYPAL_BASE}/cgi-bin/webscr?${params.toString()}`;
}

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

    // ── Create booking ────────────────────────────────────────────────────────
    const bookingId = uuidv4();
    const now = new Date().toISOString();

    const item = {
      PK:            `BOOKING#${bookingId}`,
      bookingId,
      date,
      timeSlot,
      status:        'pending',
      studentName:   studentName.trim(),
      studentEmail:  studentEmail.trim().toLowerCase(),
      paypalOrderId: '',             // filled in by IPN webhook
      amountCents:   PRICE_CENTS,
      createdAt:     now,
    };

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',  // extra safety
    }));

    // ── Build PayPal redirect URL ─────────────────────────────────────────────
    const returnWithId = `${PAYPAL_RETURN_URL}?bookingId=${bookingId}`;
    const paypalUrl = buildPayPalUrl(
      bookingId,
      PRICE_CENTS,
      PRICE_CURRENCY,
      returnWithId,
      PAYPAL_CANCEL_URL,
    );

    return ok({
      bookingId,
      paypalUrl,
      message: 'Booking created. Redirect user to paypalUrl to complete payment.',
    });
  } catch (err) {
    console.error('createBooking error:', err);
    return serverError();
  }
};
