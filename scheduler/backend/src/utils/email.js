'use strict';

/**
 * SES v2 email helpers for the scheduler.
 *
 * Two emails per confirmed booking:
 *   - sendBookingConfirmation : student-facing "your workshop is confirmed"
 *   - sendOwnerNotification   : ops-facing "new booking" alert to the studio
 *
 * Both emails carry an .ics calendar attachment so Gmail / Apple Mail show a
 * one-click "Add to calendar" UI. Truly automatic Google Calendar sync (no
 * click required) is a separate epic — see follow-up issue.
 *
 * Failures from SES are logged but do NOT block booking confirmation. The
 * booking is the source of truth in DynamoDB; email is best-effort.
 */

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({ region: process.env.AWS_REGION || 'eu-central-1' });

const FROM_ADDRESS         = process.env.SES_FROM_ADDRESS;
const REPLY_TO             = process.env.SES_REPLY_TO;
const OWNER_NOTIFY_ADDRESS = process.env.OWNER_NOTIFY_ADDRESS;

const STUDIO_ADDRESS = 'Steegerstr. 1A, 13359 Berlin';
const STUDIO_TZ      = 'Europe/Berlin';

// ── Date / time helpers ───────────────────────────────────────────────────

/** "2026-05-07" + "14:00" → "20260507T140000" (no separators, no TZ) */
function icsLocalStamp(dateStr, timeStr) {
  return `${dateStr.replace(/-/g, '')}T${timeStr.replace(':', '')}00`;
}

/** Now in UTC, ICS basic format, e.g. "20260506T145931Z" */
function icsUtcNow() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

/** Format YYYY-MM-DD as "Tuesday, 7 May 2026" in en-GB. */
function formatDate(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatPrice(cents, currency = 'EUR') {
  const symbol = currency === 'EUR' ? '€' : (currency + ' ');
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

// ── ICS / Google Calendar builders ────────────────────────────────────────

/** Escape RFC 5545 TEXT values: commas, semicolons, backslashes, newlines. */
function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 line folding — fold any line longer than 75 octets onto continuation
 * lines starting with a single space. Conservative: counts UTF-16 chars not
 * octets. Good enough for our short content.
 */
function foldIcsLines(text) {
  return text.split('\r\n').map((line) => {
    if (line.length <= 75) return line;
    const out = [];
    let rest = line;
    out.push(rest.slice(0, 75));
    rest = rest.slice(75);
    while (rest.length > 74) {
      out.push(' ' + rest.slice(0, 74));
      rest = rest.slice(74);
    }
    if (rest.length > 0) out.push(' ' + rest);
    return out.join('\r\n');
  }).join('\r\n');
}

function buildIcs(booking) {
  const summary  = `Wheel-throwing workshop — ${booking.studentName}`;
  const desc     = [
    `Booker: ${booking.studentName} <${booking.studentEmail}>`,
    `Price: ${formatPrice(booking.amountCents || 9500)} (paid via PayPal)`,
    `Booking ID: ${booking.bookingId}`,
  ].join('\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Palavara Studio//Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.bookingId}@studio.palavara.com`,
    `DTSTAMP:${icsUtcNow()}`,
    `DTSTART;TZID=${STUDIO_TZ}:${icsLocalStamp(booking.date, booking.timeSlot)}`,
    `DTEND;TZID=${STUDIO_TZ}:${icsLocalStamp(booking.date, booking.slotEnd)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `LOCATION:${icsEscape(STUDIO_ADDRESS)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `ORGANIZER;CN=Palavara Studio:MAILTO:${stripDisplayName(FROM_ADDRESS)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return foldIcsLines(lines) + '\r\n';
}

function buildGoogleCalendarUrl(booking) {
  const summary = `Wheel-throwing workshop — ${booking.studentName}`;
  const start = icsLocalStamp(booking.date, booking.timeSlot);
  const end   = icsLocalStamp(booking.date, booking.slotEnd);
  const details = [
    `Booker: ${booking.studentName} <${booking.studentEmail}>`,
    `Price: ${formatPrice(booking.amountCents || 9500)} (paid via PayPal)`,
    `Booking ID: ${booking.bookingId}`,
  ].join('\n');

  const params = new URLSearchParams({
    action:    'TEMPLATE',
    text:      summary,
    dates:     `${start}/${end}`,
    ctz:       STUDIO_TZ,
    details,
    location:  STUDIO_ADDRESS,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── HTML helpers ──────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip display name from an RFC-5322 address: "Foo <a@b>" -> "a@b". */
function stripDisplayName(addr) {
  if (!addr) return '';
  const m = String(addr).match(/<([^>]+)>/);
  return m ? m[1] : addr;
}

// ── Email senders ─────────────────────────────────────────────────────────

/**
 * Send the workshop-confirmation email to the student. Includes the .ics and
 * a Google Calendar link.
 */
async function sendBookingConfirmation(booking) {
  if (!FROM_ADDRESS) {
    console.warn('SES_FROM_ADDRESS not configured — skipping student email');
    return false;
  }

  const dateLine  = formatDate(booking.date);
  const timeLine  = `${booking.timeSlot} – ${booking.slotEnd}`;
  const priceLine = formatPrice(booking.amountCents || 9500, 'EUR');
  const gcalUrl   = buildGoogleCalendarUrl(booking);
  const ics       = buildIcs(booking);

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
    `Add to Google Calendar: ${gcalUrl}`,
    'A calendar invite is also attached to this email.',
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
  <p style="margin: 16px 0;">
    <a href="${escapeHtml(gcalUrl)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:8px 16px;border-radius:4px;">
      Add to Google Calendar
    </a>
    <span style="color:#6b7280; font-size: 13px; margin-left: 8px;">(or open the attached calendar invite)</span>
  </p>
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

  return sendWithIcs({
    to:        booking.studentEmail,
    subject,
    text,
    html,
    icsContent: ics,
    icsFilename: 'workshop.ics',
    replyTo:   REPLY_TO,
    logTag:    'student',
    bookingId: booking.bookingId,
  });
}

/**
 * Send a separate ops-style notification to the studio owner. Reply-To is the
 * student's email so the owner can reply directly. Includes the .ics and the
 * Google Calendar link so the owner can add the workshop to their calendar.
 */
async function sendOwnerNotification(booking) {
  if (!FROM_ADDRESS || !OWNER_NOTIFY_ADDRESS) {
    console.warn('SES sender or OWNER_NOTIFY_ADDRESS not configured — skipping owner email');
    return false;
  }

  const dateLine  = formatDate(booking.date);
  const timeLine  = `${booking.timeSlot} – ${booking.slotEnd}`;
  const priceLine = formatPrice(booking.amountCents || 9500, 'EUR');
  const gcalUrl   = buildGoogleCalendarUrl(booking);
  const ics       = buildIcs(booking);

  const subject = `New booking: ${booking.studentName} — ${dateLine}, ${timeLine}`;

  const text = [
    'A new wheel-throwing workshop booking has been confirmed.',
    '',
    `  Booker:     ${booking.studentName} <${booking.studentEmail}>`,
    `  Date:       ${dateLine}`,
    `  Time:       ${timeLine}`,
    `  Price:      ${priceLine} (paid via PayPal)`,
    `  Booking ID: ${booking.bookingId}`,
    '',
    `Add to Google Calendar: ${gcalUrl}`,
    'A calendar invite is also attached to this email.',
    '',
    'Reply to this email to contact the booker directly.',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html><body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111; line-height: 1.55;">
  <p>A new wheel-throwing workshop booking has been confirmed.</p>
  <table cellpadding="4" style="border-collapse: collapse; margin: 12px 0;">
    <tr><td style="color:#6b7280">Booker</td><td><strong>${escapeHtml(booking.studentName)}</strong> &lt;<a href="mailto:${escapeHtml(booking.studentEmail)}">${escapeHtml(booking.studentEmail)}</a>&gt;</td></tr>
    <tr><td style="color:#6b7280">Date</td><td><strong>${escapeHtml(dateLine)}</strong></td></tr>
    <tr><td style="color:#6b7280">Time</td><td><strong>${escapeHtml(timeLine)}</strong></td></tr>
    <tr><td style="color:#6b7280">Price</td><td><strong>${escapeHtml(priceLine)}</strong> (paid via PayPal)</td></tr>
    <tr><td style="color:#6b7280">Booking ID</td><td><code>${escapeHtml(booking.bookingId)}</code></td></tr>
  </table>
  <p style="margin: 16px 0;">
    <a href="${escapeHtml(gcalUrl)}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:8px 16px;border-radius:4px;">
      Add to Google Calendar
    </a>
    <span style="color:#6b7280; font-size: 13px; margin-left: 8px;">(or open the attached calendar invite)</span>
  </p>
  <p style="color:#6b7280; font-size: 13px;">Reply to this email to contact the booker directly.</p>
</body></html>`;

  return sendWithIcs({
    to:        OWNER_NOTIFY_ADDRESS,
    subject,
    text,
    html,
    icsContent: ics,
    icsFilename: `booking-${booking.bookingId.slice(0, 8)}.ics`,
    replyTo:   booking.studentEmail,
    logTag:    'owner',
    bookingId: booking.bookingId,
  });
}

// ── SES sender (Raw MIME so we can attach .ics) ───────────────────────────

/**
 * Build a multipart/mixed Raw MIME message and call SendEmail. Using Raw
 * (instead of Simple+Attachments) keeps us portable across SDK versions.
 */
async function sendWithIcs({ to, subject, text, html, icsContent, icsFilename, replyTo, logTag, bookingId }) {
  const boundary    = `b1_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const altBoundary = `b2_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: ${FROM_ADDRESS}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeMimeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean).join('\r\n');

  const body = [
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${altBoundary}--`,
    '',
    `--${boundary}`,
    `Content-Type: text/calendar; method=REQUEST; charset=UTF-8; name="${icsFilename}"`,
    `Content-Disposition: attachment; filename="${icsFilename}"`,
    'Content-Transfer-Encoding: 8bit',
    '',
    icsContent,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const rawMessage = headers + '\r\n\r\n' + body;

  try {
    await ses.send(new SendEmailCommand({
      Content: { Raw: { Data: Buffer.from(rawMessage, 'utf8') } },
    }));
    console.log(`${logTag} email sent`, { bookingId, to });
    return true;
  } catch (err) {
    console.error(`${logTag} SES send failed`, { bookingId, to, error: err?.message || err });
    return false;
  }
}

/** RFC 2047 encoded-word for Subject lines containing non-ASCII (UTF-8 / base64). */
function encodeMimeHeader(s) {
  // Only encode if the subject contains anything outside ASCII printable.
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

module.exports = { sendBookingConfirmation, sendOwnerNotification };
