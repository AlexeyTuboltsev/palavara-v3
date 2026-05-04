'use strict';

/**
 * POST /webhooks/paypal   (PayPal IPN receiver)
 *
 * Flow:
 *  1. Receive raw IPN post body from PayPal.
 *  2. Re-post the same body with "cmd=_notify-validate" back to PayPal.
 *  3. PayPal replies "VERIFIED" or "INVALID".
 *  4. On VERIFIED, check payment_status = "Completed" and amount matches.
 *  5. Update booking status → "confirmed", store paypalOrderId & confirmedAt.
 *
 * PayPal IPN docs:
 *   https://developer.paypal.com/api/nvp-soap/ipn/
 *
 * IMPORTANT: This endpoint must be publicly reachable by PayPal's servers.
 * The URL is passed as `notify_url` in the PayPal redirect (createBooking.js).
 */

const { UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');

const TABLE            = process.env.BOOKINGS_TABLE;
const IPN_VERIFY_URL   = process.env.PAYPAL_IPN_VERIFY_URL
  || 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';
const PRICE_CENTS      = parseInt(process.env.PRICE_CENTS || '2000', 10);
const PRICE_CURRENCY   = process.env.PRICE_CURRENCY || 'EUR';

/**
 * Verify an IPN message by bouncing it back to PayPal.
 * @param {string} rawBody — the raw application/x-www-form-urlencoded body
 * @returns {Promise<boolean>}
 */
async function verifyIpn(rawBody) {
  // Use dynamic import for node-fetch (ESM) or fall back to https module
  let fetchFn;
  try {
    const { default: fetch } = await import('node-fetch');
    fetchFn = fetch;
  } catch {
    // node 18+ has global fetch
    fetchFn = globalThis.fetch;
  }

  const verifyBody = 'cmd=_notify-validate&' + rawBody;

  const response = await fetchFn(IPN_VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'palavara-scheduler/1.0',
    },
    body: verifyBody,
  });

  const text = await response.text();
  return text.trim() === 'VERIFIED';
}

exports.handler = async (event) => {
  // Always return 200 immediately — PayPal requires it.
  // Processing happens async; errors are logged but don't affect the response.
  const rawBody = event.body || '';

  try {
    const params = new URLSearchParams(rawBody);

    const paymentStatus  = params.get('payment_status');
    const paymentGross   = params.get('mc_gross');
    const paymentCurrency = params.get('mc_currency');
    const txnId          = params.get('txn_id');
    const bookingId      = params.get('custom'); // we set this in createBooking

    console.log('IPN received', { paymentStatus, txnId, bookingId });

    // ── Step 1: Verify with PayPal ──────────────────────────────────────────
    const verified = await verifyIpn(rawBody);
    if (!verified) {
      console.warn('IPN verification failed — ignoring message');
      return { statusCode: 200, body: '' };
    }

    // ── Step 2: Check payment status ─────────────────────────────────────────
    if (paymentStatus !== 'Completed') {
      console.log(`IPN: payment_status=${paymentStatus} — not completed, skipping`);
      return { statusCode: 200, body: '' };
    }

    // ── Step 3: Validate amount & currency ───────────────────────────────────
    const paidCents = Math.round(parseFloat(paymentGross) * 100);
    if (paidCents !== PRICE_CENTS || paymentCurrency !== PRICE_CURRENCY) {
      console.error('IPN amount/currency mismatch', {
        expected: { cents: PRICE_CENTS, currency: PRICE_CURRENCY },
        received: { cents: paidCents, currency: paymentCurrency },
      });
      return { statusCode: 200, body: '' };
    }

    // ── Step 4: Fetch booking ─────────────────────────────────────────────────
    if (!bookingId) {
      console.warn('IPN: missing custom (bookingId) field');
      return { statusCode: 200, body: '' };
    }

    const existing = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${bookingId}` },
    }));

    if (!existing.Item) {
      console.error('IPN: booking not found', bookingId);
      return { statusCode: 200, body: '' };
    }

    if (existing.Item.status === 'confirmed') {
      console.log('IPN: booking already confirmed (duplicate IPN?)', bookingId);
      return { statusCode: 200, body: '' };
    }

    // ── Step 5: Confirm booking ───────────────────────────────────────────────
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `BOOKING#${bookingId}` },
      UpdateExpression: 'SET #s = :confirmed, paypalOrderId = :txn, confirmedAt = :now',
      ConditionExpression: '#s = :pending',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':confirmed': 'confirmed',
        ':pending':   'pending',
        ':txn':       txnId || '',
        ':now':       new Date().toISOString(),
      },
    }));

    console.log('Booking confirmed', { bookingId, txnId });
  } catch (err) {
    console.error('paypalWebhook error:', err);
    // Still return 200 so PayPal doesn't retry indefinitely
  }

  return { statusCode: 200, body: '' };
};
