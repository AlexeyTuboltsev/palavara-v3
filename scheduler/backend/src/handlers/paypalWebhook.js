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
 *
 * Cycle bookings: custom_id is the session-1 bookingId. After confirming
 * that row, this handler propagates the confirmation to the remaining
 * cycle siblings via cycleLogic.transactUpdateAll. Email + calendar
 * side-effects are skipped for cycles (Phase 5 ships a cycle-aware
 * summary email and a multi-event ICS).
 */

const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { verifyWebhookSignature } = require('../utils/paypal');
const { sendBookingConfirmation, sendOwnerNotification } = require('../email');
const { insertBookingEvent } = require('../utils/googleCalendar');
const { findCycleSiblings, transactUpdateAll } = require('../utils/cycleLogic');

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

    // custom_id was set to bookingId when we created the order (for cycles
    // it's the session-1 bookingId).
    const bookingId = payload.resource?.custom_id;
    const captureId = payload.resource?.id;
    if (!bookingId) {
      console.warn('webhook: PAYMENT.CAPTURE.COMPLETED with no custom_id');
      return { statusCode: 200, body: '' };
    }

    const now = new Date().toISOString();
    let updated;
    try {
      const r = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `BOOKING#${bookingId}` },
        UpdateExpression: 'SET #s = :confirmed, paypalCaptureId = :cap, confirmedAt = :now',
        ConditionExpression: 'attribute_exists(PK) AND #s = :pending',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':confirmed': 'confirmed',
          ':pending':   'pending',
          ':cap':       captureId || '',
          ':now':       now,
        },
        ReturnValues: 'ALL_NEW',
      }));
      updated = r.Attributes;
      console.log('webhook: booking confirmed', { bookingId, captureId });
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        // Already confirmed (sync capture beat us, or duplicate webhook).
        console.log('webhook: booking already confirmed or missing', { bookingId });
        return { statusCode: 200, body: '' };
      }
      throw err;
    }

    // Cycle propagation: bring the rest of the cycle siblings to confirmed
    // in a single transaction. Conditional `status = :pending` on each row
    // makes the operation idempotent if the webhook fires twice.
    if (updated.cycleId) {
      try {
        const siblings = (await findCycleSiblings(updated.cycleId))
          .filter((row) => row.bookingId !== bookingId);
        if (siblings.length > 0) {
          await transactUpdateAll(siblings, {
            updateExpression: 'SET #s = :confirmed, paypalCaptureId = :cap, confirmedAt = :now',
            conditionExpression: '#s = :pending',
            expressionAttributeNames: { '#s': 'status' },
            expressionAttributeValues: {
              ':confirmed': 'confirmed',
              ':pending':   'pending',
              ':cap':       captureId || '',
              ':now':       now,
            },
          });
          console.log('webhook: cycle siblings confirmed', {
            cycleId: updated.cycleId,
            siblingCount: siblings.length,
          });
        }
      } catch (err) {
        if (err.name === 'TransactionCanceledException') {
          // At least one sibling wasn't `pending` (e.g. already confirmed by
          // a duplicate webhook). Safe to ignore — the cycle is in the right
          // state either way.
          console.log('webhook: cycle siblings already confirmed', {
            cycleId: updated.cycleId,
          });
        } else {
          throw err;
        }
      }
      // Email + calendar are intentionally NOT fired for cycles in Phase 4.
      // Phase 5 will ship the cycle-aware summary email and multi-event ICS.
      return { statusCode: 200, body: '' };
    }

    // Single-session path — fire the usual side-effects.
    await Promise.all([
      sendBookingConfirmation(updated),
      sendOwnerNotification(updated),
      insertBookingEvent(updated).catch((e) => {
        console.error('googleCalendar insert failed', { bookingId, error: e?.message || e });
      }),
    ]);
  } catch (err) {
    console.error('webhook handler error:', err);
  }

  return { statusCode: 200, body: '' };
};
