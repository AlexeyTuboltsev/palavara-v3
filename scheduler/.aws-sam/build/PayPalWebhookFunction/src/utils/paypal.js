'use strict';

/**
 * PayPal Orders v2 REST client — minimal wrapper around the three calls we need:
 *   - getAccessToken    : OAuth2 client credentials grant
 *   - createOrder       : POST /v2/checkout/orders
 *   - captureOrder      : POST /v2/checkout/orders/{id}/capture
 *   - verifyWebhookSig  : POST /v1/notifications/verify-webhook-signature
 *
 * Auth is HTTP Basic with PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET.
 * Token is cached in module scope across warm Lambda invocations.
 */

const API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  // Refresh 60s before expiry to avoid edge-case 401s.
  if (cachedToken && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // expires_in is seconds; default 9h. Cache for that window.
  cachedTokenExpiresAt = now + (data.expires_in || 32_400) * 1000;
  return cachedToken;
}

/**
 * Create a PayPal Order (intent: CAPTURE) and return the approve URL the
 * user should be redirected to.
 *
 * @param {object} args
 * @param {string} args.bookingId       Our internal booking UUID
 * @param {number} args.amountCents     Price in minor units
 * @param {string} args.currency        ISO 4217 (EUR)
 * @param {string} args.returnUrl       URL PayPal redirects to after approval
 * @param {string} args.cancelUrl       URL PayPal redirects to on cancel
 * @returns {Promise<{orderId: string, approveUrl: string}>}
 */
async function createOrder({ bookingId, amountCents, currency, returnUrl, cancelUrl }) {
  const token = await getAccessToken();
  const value = (amountCents / 100).toFixed(2);

  const body = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: bookingId,
      custom_id: bookingId,
      description: `Palavara lesson booking ${bookingId}`,
      amount: { currency_code: currency, value },
    }],
    application_context: {
      brand_name: 'Palavara',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': bookingId,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal createOrder failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const approve = (data.links || []).find((l) => l.rel === 'approve' || l.rel === 'payer-action');
  if (!approve?.href) {
    throw new Error('PayPal createOrder: no approve link in response');
  }

  return { orderId: data.id, approveUrl: approve.href };
}

/**
 * Capture an approved PayPal Order. Returns the capture object, which
 * includes status (COMPLETED on success) and the capture id.
 *
 * @param {string} orderId
 * @returns {Promise<{status: string, captureId: string, raw: object}>}
 */
async function captureOrder(orderId) {
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Idempotency — same key returns the same result if the user double-clicks.
      'PayPal-Request-Id': `capture-${orderId}`,
    },
    body: '{}',
    signal: AbortSignal.timeout(15_000),
  });

  // PayPal returns 201 on first capture, 200 if the order was already captured
  // (depending on idempotency key). Treat both as success.
  if (res.status !== 200 && res.status !== 201) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal captureOrder failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) {
    throw new Error('PayPal captureOrder: no capture in response');
  }

  return { status: capture.status, captureId: capture.id, raw: data };
}

/**
 * Refund a captured payment, in full. Returns the refund id and status.
 * Use for cancellations within the refund window.
 *
 * @param {object} args
 * @param {string} args.captureId   The PayPal capture id (saved when capture succeeded)
 * @param {number} args.amountCents Amount to refund in minor units
 * @param {string} args.currency    ISO 4217
 * @param {string} args.bookingId   Used as idempotency key + custom_id
 * @returns {Promise<{status: string, refundId: string}>}
 */
async function refundCapture({ captureId, amountCents, currency, bookingId }) {
  const token = await getAccessToken();
  const value = (amountCents / 100).toFixed(2);

  const res = await fetch(`${API_BASE}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `refund-${bookingId}`,
    },
    body: JSON.stringify({
      amount: { value, currency_code: currency },
      note_to_payer: 'Workshop cancellation refund — Palavara Studio',
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (res.status !== 200 && res.status !== 201) {
    const text = await res.text().catch(() => '');
    throw new Error(`PayPal refundCapture failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { status: data.status, refundId: data.id };
}

/**
 * Verify a Webhooks v2 signature by calling PayPal's verification endpoint.
 * @param {object} headers      Lowercased request headers
 * @param {object} eventBody    Parsed JSON event payload
 * @param {string} webhookId    PayPal Webhook ID (configured in PayPal app)
 * @returns {Promise<boolean>}
 */
async function verifyWebhookSignature(headers, eventBody, webhookId) {
  if (!webhookId) {
    console.warn('PAYPAL_WEBHOOK_ID not configured — refusing webhook');
    return false;
  }

  const token = await getAccessToken();

  const verifyBody = {
    auth_algo:        headers['paypal-auth-algo'],
    cert_url:         headers['paypal-cert-url'],
    transmission_id:  headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id:       webhookId,
    webhook_event:    eventBody,
  };

  const res = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verifyBody),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`PayPal verify failed (${res.status}): ${text}`);
    return false;
  }

  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

module.exports = { getAccessToken, createOrder, captureOrder, refundCapture, verifyWebhookSignature };
