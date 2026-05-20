'use strict';

/**
 * Google Calendar API v3 client — service-account flavour.
 *
 * Auth model:
 *   - A service account (palavara-scheduler@palavara-studio.iam.gserviceaccount.com)
 *     is the principal. Its private key is stored in SSM Parameter Store as
 *     a SecureString JSON document (the standard Google service-account key file).
 *   - Lambdas call getAccessToken which loads the SA key from SSM (cached
 *     per warm container), signs a short-lived JWT, exchanges it via
 *     Google's /token endpoint for an access token (also cached, ~50min).
 *   - The target calendar must be explicitly shared with the SA's email
 *     and granted "Make changes to events". The SA cannot reach the user's
 *     "primary" calendar — give it the calendar's address (e.g.
 *     palavarastudio@gmail.com for someone's primary).
 *
 * Why service account, not OAuth refresh token? Refresh tokens in apps
 * with "Testing" OAuth consent screens expire every 7 days. Publishing
 * the app requires going through Google's verification for sensitive
 * scopes. Service accounts have neither problem — the key is long-lived
 * until manually rotated. See palavara-v3 commit history for the swap.
 *
 * All Calendar API failures are surfaced as thrown errors. Callers
 * should wrap in try/catch and treat sync failures as best-effort —
 * the booking row in DynamoDB stays the source of truth.
 */

const crypto = require('crypto');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssm = new SSMClient({ region: process.env.AWS_REGION || 'eu-central-1' });

const CAL_API_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPE        = 'https://www.googleapis.com/auth/calendar.events';
const DEFAULT_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const SA_KEY_PARAM = process.env.GOOGLE_SA_KEY_PARAM;
const CALENDAR_ID  = process.env.GOOGLE_CALENDAR_ID;

let cachedSaKey = null;
let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;


// ── Service-account key + access token ─────────────────────────────────


/** Load the SA key JSON from SSM (cached per Lambda container lifetime). */
async function loadServiceAccountKey() {
    if (cachedSaKey) return cachedSaKey;
    if (!SA_KEY_PARAM) {
        throw new Error('GOOGLE_SA_KEY_PARAM not configured');
    }
    const r = await ssm.send(new GetParameterCommand({
        Name: SA_KEY_PARAM,
        WithDecryption: true,
    }));
    if (!r.Parameter?.Value) {
        throw new Error(`SSM parameter ${SA_KEY_PARAM} is empty`);
    }
    let parsed;
    try {
        parsed = JSON.parse(r.Parameter.Value);
    } catch (err) {
        throw new Error(`SSM parameter ${SA_KEY_PARAM} is not valid JSON: ${err.message}`);
    }
    if (!parsed.client_email || !parsed.private_key) {
        throw new Error('SA key missing client_email or private_key');
    }
    cachedSaKey = parsed;
    return cachedSaKey;
}


/** Base64-url-encode an object as compact JSON. Node 16+ supports 'base64url' natively. */
function base64urlJson(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
}


/**
 * Get an OAuth access token via the JWT-bearer grant. Tokens are valid
 * for ~1h; we cache and re-mint when within 60s of expiry. RS256-sign
 * the JWT with Node's built-in `crypto` so no external dep is needed.
 */
async function getAccessToken() {
    const nowSec = Math.floor(Date.now() / 1000);
    if (cachedAccessToken && nowSec < cachedAccessTokenExpiresAt - 60) {
        return cachedAccessToken;
    }

    const key = await loadServiceAccountKey();
    const tokenUrl = key.token_uri || DEFAULT_TOKEN_URL;

    const header = base64urlJson({ alg: 'RS256', typ: 'JWT' });
    const claims = base64urlJson({
        iss:   key.client_email,
        scope: SCOPE,
        aud:   tokenUrl,
        exp:   nowSec + 3600,
        iat:   nowSec,
    });
    const signingInput = `${header}.${claims}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const signature = signer.sign(key.private_key).toString('base64url');
    const jwt = `${signingInput}.${signature}`;

    const res = await fetch(tokenUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion:  jwt,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(`Google token exchange failed (${res.status}): ${JSON.stringify(data)}`);
    }

    cachedAccessToken = data.access_token;
    cachedAccessTokenExpiresAt = nowSec + (data.expires_in || 3600);
    return cachedAccessToken;
}


// ── Calendar API: insert + delete ──────────────────────────────────────


/**
 * Convert a booking id to a Calendar event id. Calendar event ids allow
 * a-v0-9, length 5–1024.
 *
 * Old UUID ids (e.g. "550e8400-e29b-41d4-a716-446655440000"): strip dashes,
 * lowercase — yields 32 hex chars, all valid.
 *
 * New short ids (e.g. "ABC234"): lowercase — yields 6 chars from
 * [a-v0-9] (the booking-id alphabet is picked specifically to fall inside
 * this set; see utils/bookingId.js).
 */
function eventIdFromBookingId(bookingId) {
    return bookingId.replace(/-/g, '').toLowerCase();
}


/**
 * Insert a calendar event for a confirmed booking. Idempotent: if an
 * event with the derived id already exists, Google returns 409 and we
 * treat that as success (the prior insert did the job).
 *
 * Times are passed as Europe/Berlin local. Google does its own timezone
 * arithmetic for display in the recipient's calendar.
 */
async function insertBookingEvent(booking) {
    if (!CALENDAR_ID) {
        throw new Error('GOOGLE_CALENDAR_ID not configured');
    }
    const accessToken = await getAccessToken();
    const eventId = eventIdFromBookingId(booking.bookingId);

    const isHeld = booking.bookingType === 'held';
    const lessonLabel = booking.lessonTypeLabel || 'Workshop';
    const summary = isHeld
        ? `Slot held — ${booking.paymentNote || 'studio reservation'}`
        : `${lessonLabel} — ${booking.studentName || ''}`.trim();

    const description = isHeld
        ? [
            booking.paymentNote ? `Note: ${booking.paymentNote}` : 'Held by studio',
            `Booking ID: ${booking.bookingId}`,
        ].join('\n')
        : [
            booking.studentEmail ? `Booker: ${booking.studentName || ''} <${booking.studentEmail}>` : null,
            (booking.amountCents ?? 0) > 0
                ? `Price: €${((booking.amountCents || 0) / 100).toFixed(2)} (${booking.paymentMethod || 'paypal'})`
                : 'Comp / no charge',
            booking.paymentNote ? `Note: ${booking.paymentNote}` : null,
            `Booking ID: ${booking.bookingId}`,
        ].filter((l) => l).join('\n');

    const event = {
        id: eventId,
        summary,
        description,
        location: 'Steegerstr. 1A, 13359 Berlin',
        start: {
            dateTime: `${booking.date}T${booking.timeSlot}:00`,
            timeZone: 'Europe/Berlin',
        },
        end: {
            dateTime: `${booking.date}T${booking.slotEnd}:00`,
            timeZone: 'Europe/Berlin',
        },
        status: 'confirmed',
    };

    const url = `${CAL_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 409) {
        // Already exists — earlier deliver succeeded. Idempotent.
        return { eventId, alreadyExists: true };
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Google Calendar insert failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    return { eventId: data.id, alreadyExists: false };
}


/**
 * Delete the calendar event for a cancelled booking. 404/410 are
 * treated as success (already deleted / never existed).
 */
async function deleteBookingEvent(booking) {
    if (!CALENDAR_ID) {
        throw new Error('GOOGLE_CALENDAR_ID not configured');
    }
    const accessToken = await getAccessToken();
    const eventId = eventIdFromBookingId(booking.bookingId);

    const url = `${CAL_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 204 || res.status === 404 || res.status === 410) {
        return { eventId, deleted: true };
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Google Calendar delete failed (${res.status}): ${text}`);
}


module.exports = {
    insertBookingEvent,
    deleteBookingEvent,
    eventIdFromBookingId,
};
