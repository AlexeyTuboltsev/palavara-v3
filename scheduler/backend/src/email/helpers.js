'use strict';

/**
 * Pure helpers shared by every email: formatters, HTML escaping, ICS
 * builder, Google Calendar URL builder, cancel-link builder. No SES,
 * no template loading.
 */

const { signCancelToken } = require('../utils/cancelToken');

const STUDIO_ADDRESS = 'Steegerstr. 1A, 13359 Berlin';
const STUDIO_TZ      = 'Europe/Berlin';
const CANCEL_URL_BASE = process.env.CANCEL_URL_BASE || 'https://book.palavara.com/cancel.html';

// ── Date / price formatters ───────────────────────────────────────────────

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

/**
 * Render a "price + how it was paid" line. Branches on paymentMethod so
 * admin-created bookings don't claim "paid via PayPal" when payment was
 * actually a bank transfer or comp.
 */
function priceLineText(booking) {
  const cents  = booking.amountCents ?? 0;
  const method = booking.paymentMethod || 'paypal';
  const note   = booking.paymentNote;
  if (method === 'none' || cents === 0) {
    return note ? `Comp / no charge (${note})` : 'Comp / no charge';
  }
  const price = formatPrice(cents);
  if (method === 'paypal') return `Price: ${price} (paid via PayPal)`;
  if (method === 'manual') return `Price: ${price} (paid${note ? `: ${note}` : ' offline'})`;
  return `Price: ${price}`;
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

// ── ICS / Google Calendar builders ────────────────────────────────────────

function icsEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 line folding — fold any line longer than 75 octets onto
 * continuation lines starting with a single space. Conservative: counts
 * UTF-16 chars not octets. Good enough for our short content.
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

/**
 * Build a VCALENDAR. method='REQUEST' for new bookings, 'CANCEL' to
 * remove the previously-sent event from the recipient's calendar.
 *
 * For CANCEL we increment SEQUENCE to 1 — calendar clients use this to
 * know the cancellation supersedes the original REQUEST (SEQUENCE:0).
 */
function buildIcs(booking, { method = 'REQUEST', fromAddress } = {}) {
  const isHeld = booking.bookingType === 'held';
  const lessonLabel = booking.lessonTypeLabel || 'Workshop';
  const summary = isHeld
    ? `Slot held — ${booking.paymentNote || 'studio reservation'}`
    : `${lessonLabel} — ${booking.studentName}`;
  const descLines = isHeld
    ? [
        booking.paymentNote ? `Note: ${booking.paymentNote}` : 'Held by studio',
        `Booking ID: ${booking.bookingId}`,
      ]
    : [
        `Booker: ${booking.studentName} <${booking.studentEmail}>`,
        priceLineText(booking),
        `Booking ID: ${booking.bookingId}`,
      ];
  const desc = descLines.join('\\n');

  const isCancel = method === 'CANCEL';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Palavara Studio//Scheduler//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${booking.bookingId}@studio.palavara.com`,
    `DTSTAMP:${icsUtcNow()}`,
    `DTSTART;TZID=${STUDIO_TZ}:${icsLocalStamp(booking.date, booking.timeSlot)}`,
    `DTEND;TZID=${STUDIO_TZ}:${icsLocalStamp(booking.date, booking.slotEnd)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `LOCATION:${icsEscape(STUDIO_ADDRESS)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `ORGANIZER;CN=Palavara Studio:MAILTO:${stripDisplayName(fromAddress)}`,
    `STATUS:${isCancel ? 'CANCELLED' : 'CONFIRMED'}`,
    `SEQUENCE:${isCancel ? '1' : '0'}`,
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return foldIcsLines(lines) + '\r\n';
}

function buildGoogleCalendarUrl(booking) {
  const lessonLabel = booking.lessonTypeLabel || 'Workshop';
  const summary = `${lessonLabel} — ${booking.studentName}`;
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

/**
 * Build the cancellation URL the recipient clicks for self-service
 * cancellation. Token is HMAC-bound to the booking id.
 */
function buildCancelUrl(booking) {
  const token = signCancelToken(booking.bookingId);
  const u = new URL(CANCEL_URL_BASE);
  u.searchParams.set('bookingId', booking.bookingId);
  u.searchParams.set('token', token);
  return u.toString();
}

module.exports = {
  STUDIO_ADDRESS,
  STUDIO_TZ,
  formatDate,
  formatPrice,
  priceLineText,
  escapeHtml,
  stripDisplayName,
  buildIcs,
  buildGoogleCalendarUrl,
  buildCancelUrl,
};
