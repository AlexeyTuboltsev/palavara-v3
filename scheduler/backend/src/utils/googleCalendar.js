'use strict';

/**
 * Google Calendar API v3 client — minimal wrapper around the four calls
 * the scheduler needs:
 *   - exchangeAuthCode  : POST /token (one-time during OAuth setup)
 *   - getAccessToken    : POST /token (refresh-token grant, cached)
 *   - insertEvent       : POST /calendar/v3/calendars/{id}/events
 *   - deleteEvent       : DELETE /calendar/v3/calendars/{id}/events/{eventId}
 *
 * Auth model:
 *   - Owner runs a one-time OAuth consent flow. Refresh token is stored
 *     in SSM Parameter Store under GOOGLE_REFRESH_TOKEN_PARAM_NAME as
 *     a SecureString.
 *   - Lambdas call getAccessToken which loads the refresh token from
 *     SSM (cached per warm container), exchanges for an access token
 *     (also cached, ~50min lifetime), and uses it on Calendar API calls.
 *
 * All Calendar API failures are surfaced as thrown errors. Callers
 * should wrap in try/catch and treat sync failures as best-effort —
 * the booking row in DynamoDB stays the source of truth.
 */

const { SSMClient, GetParameterCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');

const ssm = new SSMClient({ region: process.env.AWS_REGION || 'eu-central-1' });

const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
const CAL_API_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPE        = 'https://www.googleapis.com/auth/calendar.events';

const CLIENT_ID         = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET     = process.env.GOOGLE_CLIENT_SECRET;
const CALENDAR_ID       = process.env.GOOGLE_CALENDAR_ID || 'primary';
const REFRESH_TOKEN_PARAM = process.env.GOOGLE_REFRESH_TOKEN_PARAM_NAME;

let cachedRefreshToken = null;
let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;


// ── OAuth setup helpers ────────────────────────────────────────────────


/**
 * Build the URL the owner visits to start the OAuth consent flow.
 * `state` is an opaque value the callback will receive back unchanged
 * — used as a CSRF token.
 */
function buildAuthUrl({ redirectUri, state }) {
    if (!CLIENT_ID) {
        throw new Error('GOOGLE_CLIENT_ID not configured');
    }
    const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  redirectUri,
        response_type: 'code',
        scope:         SCOPE,
        access_type:   'offline',
        prompt:        'consent',
        state,
    });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}


/**
 * Exchange an auth code (from the OAuth callback) for tokens, then
 * persist the refresh token in SSM. Returns the refresh token.
 */
async function exchangeAuthCodeAndStore({ code, redirectUri }) {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_ID/SECRET not configured');
    }
    if (!REFRESH_TOKEN_PARAM) {
        throw new Error('GOOGLE_REFRESH_TOKEN_PARAM_NAME not configured');
    }

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id:     CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri:  redirectUri,
            grant_type:    'authorization_code',
        }).toString(),
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Google token exchange failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    if (!data.refresh_token) {
        throw new Error('Google token response had no refresh_token — did the user already grant access? Use prompt=consent.');
    }

    // Persist to SSM.
    await ssm.send(new PutParameterCommand({
        Name:      REFRESH_TOKEN_PARAM,
        Value:     data.refresh_token,
        Type:      'SecureString',
        Overwrite: true,
    }));

    cachedRefreshToken = data.refresh_token;
    cachedAccessToken = data.access_token;
    cachedAccessTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000 - 60_000;

    return data.refresh_token;
}


// ── Runtime token plumbing ─────────────────────────────────────────────


async function loadRefreshToken() {
    if (cachedRefreshToken) return cachedRefreshToken;
    if (!REFRESH_TOKEN_PARAM) {
        throw new Error('GOOGLE_REFRESH_TOKEN_PARAM_NAME not configured');
    }
    const result = await ssm.send(new GetParameterCommand({
        Name:           REFRESH_TOKEN_PARAM,
        WithDecryption: true,
    }));
    if (!result.Parameter?.Value) {
        throw new Error(`SSM parameter ${REFRESH_TOKEN_PARAM} is empty — has the OAuth flow been completed?`);
    }
    cachedRefreshToken = result.Parameter.Value;
    return cachedRefreshToken;
}


async function getAccessToken() {
    const now = Date.now();
    if (cachedAccessToken && now < cachedAccessTokenExpiresAt) {
        return cachedAccessToken;
    }

    const refreshToken = await loadRefreshToken();

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id:     CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type:    'refresh_token',
        }).toString(),
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Google access-token refresh failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    cachedAccessToken = data.access_token;
    cachedAccessTokenExpiresAt = now + (data.expires_in || 3600) * 1000 - 60_000;
    return cachedAccessToken;
}


// ── Event ID derivation ────────────────────────────────────────────────


/**
 * Convert a booking UUID to a Calendar event id. Calendar IDs allow
 * a-v0-9 (32 chars) and 5–1024 chars long. UUID hex (0-9, a-f) is a
 * subset, so just strip dashes and lowercase. Result is exactly 32
 * chars — well within the limit.
 */
function eventIdFromBookingId(bookingId) {
    return bookingId.replace(/-/g, '').toLowerCase();
}


// ── Calendar API: insert + delete ──────────────────────────────────────


/**
 * Insert a calendar event for a confirmed booking. Idempotent: if an
 * event with the derived id already exists, Google returns 409 and we
 * treat that as success (the prior insert did the job).
 *
 * Times are passed as Europe/Berlin local. Google does its own timezone
 * arithmetic for display in the recipient's calendar.
 */
async function insertBookingEvent(booking) {
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
    buildAuthUrl,
    exchangeAuthCodeAndStore,
    insertBookingEvent,
    deleteBookingEvent,
    eventIdFromBookingId,
};
