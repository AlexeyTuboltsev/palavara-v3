'use strict';

/**
 * GET /admin/google/oauth/start
 *
 * Redirects the owner's browser to Google's OAuth consent screen with
 * the right client_id, scope, and a CSRF state token. The state is an
 * HMAC over a recent timestamp so the callback can verify the
 * round-trip wasn't initiated by some third party.
 *
 * No X-Admin-Secret check on this endpoint — the start URL just bounces
 * to Google's sign-in. Consent only happens if the legitimate owner
 * approves with their Google credentials.
 */

const crypto = require('crypto');
const { buildAuthUrl } = require('../utils/googleCalendar');

const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI;
const STATE_SECRET = process.env.CANCEL_TOKEN_SECRET; // reuse existing HMAC secret

exports.handler = async () => {
    try {
        if (!REDIRECT_URI) {
            return text(500, 'GOOGLE_OAUTH_REDIRECT_URI not configured');
        }

        const ts = Date.now();
        const state = signState(ts);

        const url = buildAuthUrl({ redirectUri: REDIRECT_URI, state });

        return {
            statusCode: 302,
            headers: {
                'Location': url,
                'Cache-Control': 'no-store',
            },
            body: '',
        };
    } catch (err) {
        console.error('googleOauthStart error:', err);
        return text(500, 'OAuth start failed: ' + (err?.message || err));
    }
};

function signState(timestamp) {
    const sig = crypto
        .createHmac('sha256', STATE_SECRET || '')
        .update(`google-oauth.${timestamp}`)
        .digest('hex')
        .slice(0, 16);
    return `${timestamp}.${sig}`;
}

function text(status, body) {
    return {
        statusCode: status,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
        body,
    };
}
