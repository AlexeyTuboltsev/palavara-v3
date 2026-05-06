'use strict';

/**
 * SES v2 email helpers for the scheduler.
 *
 * The studio.palavara.com domain must be verified as a sending identity in
 * SES (eu-central-1). For sending to arbitrary recipients, the SES account
 * also needs production access (the default sandbox can only deliver to
 * verified addresses).
 *
 * Sender / reply-to are configured per environment via SAM parameters:
 *   SES_FROM_ADDRESS   — e.g. "Palavara Studio <bookings@studio.palavara.com>"
 *   SES_REPLY_TO       — e.g. "palavarastudio@gmail.com"
 *
 * sendBookingConfirmation is best-effort: any error is logged but does NOT
 * block booking confirmation. The booking is the source of truth — if email
 * fails, the user has already seen the success page; we'll surface delivery
 * failures via SES bounce notifications later.
 */

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({ region: process.env.AWS_REGION || 'eu-central-1' });

const FROM_ADDRESS = process.env.SES_FROM_ADDRESS;
const REPLY_TO     = process.env.SES_REPLY_TO;

const STUDIO_ADDRESS = 'Steegerstr. 1A, 13359 Berlin';

/**
 * Format YYYY-MM-DD as "Tuesday, 7 May 2026" in en-GB.
 * Anchor at 12:00 UTC to avoid a date shift in either US or AU timezones.
 */
function formatDate(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatPrice(cents, currency = 'EUR') {
  const symbol = currency === 'EUR' ? '€' : (currency + ' ');
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/**
 * Send the booking-confirmation email to the student.
 * Returns true on success, false on failure (errors are logged, not thrown).
 *
 * @param {object} booking — DynamoDB booking item with date, timeSlot, slotEnd,
 *                           studentName, studentEmail, amountCents, bookingId
 */
async function sendBookingConfirmation(booking) {
  if (!FROM_ADDRESS) {
    console.warn('SES_FROM_ADDRESS not configured — skipping confirmation email');
    return false;
  }

  const dateLine  = formatDate(booking.date);
  const timeLine  = `${booking.timeSlot} – ${booking.slotEnd}`;
  const priceLine = formatPrice(booking.amountCents || 9500, 'EUR');

  const subject = 'Your wheel-throwing workshop is confirmed — Palavara Studio';

  const text = [
    `Hi ${booking.studentName},`,
    '',
    'Your wheel-throwing workshop is confirmed.',
    '',
    `  Date:     ${dateLine}`,
    `  Time:     ${timeLine}`,
    `  Price:    ${priceLine} (paid)`,
    `  Location: ${STUDIO_ADDRESS}`,
    '',
    'A few practical things:',
    "  - Please arrive a few minutes early so we can start on time.",
    "  - Wear clothes you don't mind getting clay on. Aprons are provided.",
    '  - The workshop can be conducted in English or Russian — tell us on arrival.',
    '',
    'If you need to cancel or reschedule, reply to this email or write to',
    'palavarastudio@gmail.com as soon as possible.',
    '',
    'Looking forward to seeing you.',
    'Palavara Studio',
    '',
    '---',
    `Booking ID: ${booking.bookingId}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111; line-height: 1.55;">
  <p>Hi ${escapeHtml(booking.studentName)},</p>
  <p>Your wheel-throwing workshop is confirmed.</p>
  <table cellpadding="4" style="border-collapse: collapse; margin: 12px 0;">
    <tr><td style="color:#6b7280">Date</td><td><strong>${escapeHtml(dateLine)}</strong></td></tr>
    <tr><td style="color:#6b7280">Time</td><td><strong>${escapeHtml(timeLine)}</strong></td></tr>
    <tr><td style="color:#6b7280">Price</td><td><strong>${escapeHtml(priceLine)}</strong> (paid)</td></tr>
    <tr><td style="color:#6b7280">Location</td><td>${escapeHtml(STUDIO_ADDRESS)}</td></tr>
  </table>
  <p>A few practical things:</p>
  <ul>
    <li>Please arrive a few minutes early so we can start on time.</li>
    <li>Wear clothes you don't mind getting clay on. Aprons are provided.</li>
    <li>The workshop can be conducted in English or Russian — tell us on arrival.</li>
  </ul>
  <p>If you need to cancel or reschedule, reply to this email or write to
    <a href="mailto:palavarastudio@gmail.com">palavarastudio@gmail.com</a> as soon as possible.</p>
  <p>Looking forward to seeing you.<br/>Palavara Studio</p>
  <hr/>
  <p style="color:#6b7280; font-size: 12px;">Booking ID: ${escapeHtml(booking.bookingId)}</p>
</body></html>`;

  try {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      ReplyToAddresses: REPLY_TO ? [REPLY_TO] : undefined,
      Destination: { ToAddresses: [booking.studentEmail] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      },
    }));
    console.log('confirmation email sent', { bookingId: booking.bookingId, to: booking.studentEmail });
    return true;
  } catch (err) {
    console.error('SES send failed', { bookingId: booking.bookingId, error: err?.message || err });
    return false;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendBookingConfirmation };
