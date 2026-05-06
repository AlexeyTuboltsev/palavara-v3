'use strict';

/**
 * Signed cancellation tokens.
 *
 * The token in the cancellation link is a HMAC-SHA256 of `cancel.<bookingId>`
 * keyed by CANCEL_TOKEN_SECRET. The token is permanent (no expiry) — it
 * doesn't need one because:
 *   - Booking IDs are UUIDs (unguessable on their own).
 *   - A successfully cancelled booking has status='cancelled' and the
 *     conditional update on cancel rejects double-cancels.
 *   - The 48h refund-eligibility check is time-of-use, so re-using a stale
 *     token within the window only affects refund availability, not security.
 *
 * If the secret is rotated, all outstanding cancellation links become
 * invalid. That's a feature, not a bug.
 */

const crypto = require('crypto');

const CANCEL_TOKEN_SECRET = process.env.CANCEL_TOKEN_SECRET;

/** Returns a 32-character hex token bound to bookingId. */
function signCancelToken(bookingId) {
  if (!CANCEL_TOKEN_SECRET) {
    throw new Error('CANCEL_TOKEN_SECRET not configured');
  }
  return crypto
    .createHmac('sha256', CANCEL_TOKEN_SECRET)
    .update(`cancel.${bookingId}`)
    .digest('hex')
    .slice(0, 32);
}

/** Constant-time check that the supplied token matches what we'd sign. */
function verifyCancelToken(bookingId, token) {
  if (!token || typeof token !== 'string' || token.length !== 32) return false;
  const expected = signCancelToken(bookingId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { signCancelToken, verifyCancelToken };
