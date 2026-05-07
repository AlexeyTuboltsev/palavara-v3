'use strict';

/**
 * GET /admin/google/oauth/callback?code=…&state=…
 *
 * Receives the authorization code from Google after the owner approves
 * consent. Verifies the state CSRF token, exchanges the code for
 * tokens, persists the refresh token in SSM, and renders a tiny HTML
 * success page.
 *
 * Public endpoint — Google's redirect can't carry an X-Admin-Secret
 * header. Safety comes from:
 *   1. The state parameter is HMAC-signed by the start endpoint and
 *      checked here. An attacker hitting the callback directly with a
 *      forged code would fail state verification.
 *   2. Only the owner can complete Google's consent screen because only
 *      they have credentials for the studio's Google account.
 */

const crypto = require('crypto');
const { exchangeAuthCodeAndStore } = require('../utils/googleCalendar');

const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI;
const STATE_SECRET = process.env.CANCEL_TOKEN_SECRET;
const STATE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

exports.handler = async (event) => {
    try {
        const q = event.queryStringParameters || {};
        const code = q.code;
        const state = q.state;
        const error = q.error;

        if (error) {
            return html(400, errorPage(`Google returned an error: ${error}`));
        }
        if (!code || !state) {
            return html(400, errorPage('Missing code or state parameter.'));
        }
        if (!REDIRECT_URI) {
            return html(500, errorPage('GOOGLE_OAUTH_REDIRECT_URI not configured.'));
        }

        if (!verifyState(state)) {
            return html(400, errorPage('Invalid or expired state parameter — start the flow again.'));
        }

        await exchangeAuthCodeAndStore({ code, redirectUri: REDIRECT_URI });

        return html(200, successPage());
    } catch (err) {
        console.error('googleOauthCallback error:', err);
        return html(500, errorPage('Token exchange failed: ' + (err?.message || err)));
    }
};


function verifyState(state) {
    const idx = state.indexOf('.');
    if (idx < 0) return false;
    const tsStr = state.slice(0, idx);
    const sig = state.slice(idx + 1);
    const ts = parseInt(tsStr, 10);
    if (!ts || isNaN(ts)) return false;

    if (Date.now() - ts > STATE_MAX_AGE_MS) return false;

    const expected = crypto
        .createHmac('sha256', STATE_SECRET || '')
        .update(`google-oauth.${ts}`)
        .digest('hex')
        .slice(0, 16);

    if (sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}


function html(status, body) {
    return {
        statusCode: status,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        body,
    };
}


function successPage() {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Calendar connected</title>
<style>body{font-family:system-ui,sans-serif;max-width:520px;margin:6rem auto;padding:0 1rem;color:#111}
h1{color:#1a7f4b}p{color:#444;line-height:1.55}</style></head>
<body>
<h1>✓ Google Calendar connected</h1>
<p>The studio's Google Calendar is now linked. Future workshop bookings will land on
the calendar automatically; cancellations will remove the event.</p>
<p>You can close this tab.</p>
</body></html>`;
}


function errorPage(msg) {
    const safe = String(msg).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>OAuth error</title>
<style>body{font-family:system-ui,sans-serif;max-width:520px;margin:6rem auto;padding:0 1rem;color:#111}
h1{color:#b91c1c}p{color:#444;line-height:1.55}code{background:#f3f4f6;padding:0.1rem 0.4rem;border-radius:3px}</style></head>
<body>
<h1>OAuth error</h1>
<p>${safe}</p>
<p>Try again at <code>/admin/google/oauth/start</code>.</p>
</body></html>`;
}
