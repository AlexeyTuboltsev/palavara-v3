'use strict';

/**
 * POST /webhooks/paypal — PayPal Webhooks v2 receiver
 *
 * Verifies the signature via PayPal's verify-webhook-signature endpoint, then
 * confirms the booking when a PAYMENT.CAPTURE.COMPLETED event arrives.
 *
 * Configured in PayPal Dashboard → Webhooks. Subscribe to:
 *   - PAYMENT.CAPTURE.COMPLETED  (primary signal)
 *   - PAYMENT.CAPTURE.DENIED     (optional — for ops visibility)
 *
 * The synchronous capture flow in /bookings/{id}/capture handles the happy
 * path; this webhook is the backup for cases where the user closes the
 * browser before the return URL fires, or where the capture call fails
 * server-side but PayPal has already taken the money.
 */

const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { verifyWebhookSignature } = require('../utils/paypal');
const { sendBookingConfirmation } = require('../utils/email');

const TABLE       = process.env.BOOKINGS_TABLE;
const WEBHOOK_ID  = process.env.PAYPAL_WEBHOOK_ID;

exports.handler = async (event) => {
  // PayPal expects a 200 within ~25s or it retries. We always return 200
  // and log errors — duplicate retries are handled idempotently below.
  try {
    const rawBody = event.body || '';
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.warn('webhook: invalid JSON body');
      return { statusCode: 200, body: '' };
    }

    // API Gateway lower-cases header keys for HTTP API but not REST API;
    // normalise both to lowercase before passing to verifier.
    const headers = {};
    for (const [k, v] of Object.entries(event.headers || {})) {
      headers[k.toLowerCase()] = v;
    }

    const verified = await verifyWebhookSignature(headers, payload, WEBHOOK_ID);
    if (!verified) {
      console.warn('webhook: signature verification failed', {
        eventType: payload.event_type,
        id: payload.id,
      });
      return { statusCode: 200, body: '' };
    }

    if (payload.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      console.log('webhook: ignoring event type', payload.event_type);
      return { statusCode: 200, body: '' };
    }

    // custom_id was set to bookingId when we created the order.
    const bookingId = payload.resource?.custom_id;
    const captureId = payload.resource?.id;
    if (!bookingId) {
      console.warn('webhook: PAYMENT.CAPTURE.COMPLETED with no custom_id');
      return { statusCode: 200, body: '' };
    }

    try {
      const updated = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `BOOKING#${bookingId}` },
        UpdateExpression: 'SET #s = :confirmed, paypalCaptureId = :cap, confirmedAt = :now',
        ConditionExpression: 'attribute_exists(PK) AND #s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':confirmed': 'confirmed',
          ':pending':   'pending',
          ':cap':       captureId || '',
          ':now':       new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }));
      console.log('webhook: booking confirmed', { bookingId, captureId });
      // We won the conditional flip — send the confirmation email. The sync
      // capture path didn't, so this is the only place email gets sent for
      // bookings that browser-close after PayPal approval.
      await sendBookingConfirmation(updated.Attributes);
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        // Already confirmed (sync capture beat us, or duplicate webhook).
        console.log('webhook: booking already confirmed or missing', { bookingId });
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('webhook handler error:', err);
  }

  return { statusCode: 200, body: '' };
};
