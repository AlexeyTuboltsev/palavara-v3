'use strict';

/**
 * SES email senders for the scheduler.
 *
 * Two emails per confirmed booking and two per cancellation. All four
 * carry an .ics calendar attachment so Gmail / Apple Mail show a
 * one-click "Add to calendar" or "Remove from calendar" UI.
 *
 * SES failures are logged but never throw — the booking is the source
 * of truth in DynamoDB, email is best-effort.
 *
 * Copy lives in templates/<name>/{subject.txt, body.txt, body.html}.
 * This file just builds the substitution context and picks the right
 * template variant.
 */

const {
  STUDIO_ADDRESS,
  formatDate,
  formatPrice,
  priceLineText,
  escapeHtml,
  buildIcs,
  buildGoogleCalendarUrl,
  buildCancelUrl,
} = require('./helpers');
const { sendWithIcs, FROM_ADDRESS } = require('./send');
const { renderTemplate } = require('./render');

const REPLY_TO             = process.env.SES_REPLY_TO;
const OWNER_NOTIFY_ADDRESS = process.env.OWNER_NOTIFY_ADDRESS;

/** Lesson type label snapshotted on the booking row (e.g. "Single lesson",
 *  "Group lesson"). Falls back to "Workshop" for legacy bookings that pre-date
 *  the lesson-types catalog. */
function lessonLabelOf(booking) {
  return booking.lessonTypeLabel || 'Workshop';
}

// ── Booking confirmations ─────────────────────────────────────────────────

async function sendBookingConfirmation(booking) {
  if (!FROM_ADDRESS) {
    console.warn('SES_FROM_ADDRESS not configured — skipping student email');
    return false;
  }
  if (booking.bookingType === 'held') return false;
  if (!booking.studentEmail) return false;

  const dateLine  = formatDate(booking.date);
  const timeLine  = `${booking.timeSlot} – ${booking.slotEnd}`;
  const priceLine = priceLineText(booking);
  const showPrice = (booking.amountCents ?? 0) > 0;

  const lessonLabel = lessonLabelOf(booking);
  const ctx = {
    studentName:       booking.studentName,
    dateLine,
    timeLine,
    studioAddress:     STUDIO_ADDRESS,
    gcalUrl:           buildGoogleCalendarUrl(booking),
    cancelUrl:         buildCancelUrl(booking),
    bookingId:         booking.bookingId,
    lessonLabel,
    lessonLabelLower:  lessonLabel.toLowerCase(),
    priceLineIndented: showPrice ? `\n  ${priceLine}` : '',
    priceRowHtml:      showPrice
      ? `<tr><td style="color:#6b7280">Payment</td><td>${escapeHtml(priceLine)}</td></tr>`
      : '',
  };

  const { subject, text, html } = renderTemplate('booking-student', ctx);

  return sendWithIcs({
    to:          booking.studentEmail,
    subject,
    text,
    html,
    icsContent:  buildIcs(booking, { fromAddress: FROM_ADDRESS }),
    icsFilename: 'workshop.ics',
    replyTo:     REPLY_TO,
    logTag:      'student',
    bookingId:   booking.bookingId,
  });
}

async function sendOwnerNotification(booking) {
  if (!FROM_ADDRESS || !OWNER_NOTIFY_ADDRESS) {
    console.warn('SES sender or OWNER_NOTIFY_ADDRESS not configured — skipping owner email');
    return false;
  }

  const isHeld    = booking.bookingType === 'held';
  const dateLine  = formatDate(booking.date);
  const timeLine  = `${booking.timeSlot} – ${booking.slotEnd}`;
  const priceLine = priceLineText(booking);
  const showPrice = (booking.amountCents ?? 0) > 0;
  const note      = booking.paymentNote;

  const sharedCtx = {
    dateLine,
    timeLine,
    bookingId:           booking.bookingId,
    gcalUrl:             buildGoogleCalendarUrl(booking),
    paymentNoteIndented: note ? `\n  Note:       ${note}` : '',
    paymentNoteRowHtml:  note
      ? `<tr><td style="color:#6b7280">Note</td><td>${escapeHtml(note)}</td></tr>`
      : '',
  };

  let templateName;
  let ctx;
  if (isHeld) {
    templateName = 'booking-owner-held';
    ctx = {
      ...sharedCtx,
      paymentNoteParenthesized: note ? ` (${note})` : '',
      paymentNoteDashed:        note ? ` — ${note}` : '',
      paymentNoteDashedHtml:    note ? ` — ${escapeHtml(note)}` : '',
    };
  } else {
    templateName = 'booking-owner-student';
    const lessonLabel = lessonLabelOf(booking);
    ctx = {
      ...sharedCtx,
      studentName:       booking.studentName,
      studentEmail:      booking.studentEmail,
      cancelUrl:         buildCancelUrl(booking),
      lessonLabel,
      lessonLabelLower:  lessonLabel.toLowerCase(),
      priceLineIndented: showPrice ? `\n  ${priceLine}` : '',
      priceRowHtml:      showPrice
        ? `<tr><td style="color:#6b7280">Payment</td><td>${escapeHtml(priceLine)}</td></tr>`
        : '',
    };
  }

  const { subject, text, html } = renderTemplate(templateName, ctx);

  return sendWithIcs({
    to:          OWNER_NOTIFY_ADDRESS,
    subject,
    text,
    html,
    icsContent:  buildIcs(booking, { fromAddress: FROM_ADDRESS }),
    icsFilename: `booking-${booking.bookingId.slice(0, 8)}.ics`,
    replyTo:     booking.studentEmail || undefined,
    logTag:      isHeld ? 'owner-hold' : 'owner',
    bookingId:   booking.bookingId,
  });
}

// ── Cancellations ─────────────────────────────────────────────────────────

async function sendCancellationConfirmation(booking) {
  if (!FROM_ADDRESS) {
    console.warn('SES_FROM_ADDRESS not configured — skipping student cancel email');
    return false;
  }

  const dateLine = formatDate(booking.date);
  const timeLine = `${booking.timeSlot} – ${booking.slotEnd}`;
  const refunded = (booking.refundedAmountCents || 0) > 0;
  const refundLine = refunded
    ? `${formatPrice(booking.refundedAmountCents)} has been refunded to your PayPal account.`
    : 'No refund per the >48h policy. The slot has been released for other bookings.';

  const cancelledByStudio = booking.cancelledBy === 'studio';
  const lessonLabelLower  = lessonLabelOf(booking).toLowerCase();
  const lead = cancelledByStudio
    ? `Your ${lessonLabelLower} has been cancelled by the studio.`
    : `Your ${lessonLabelLower} has been cancelled.`;
  const closing = cancelledByStudio
    ? "We apologise for the inconvenience. Reply to this email if you'd like to rebook."
    : 'You can book another workshop at https://book.palavara.com/ whenever you like.';
  const closingHtml = cancelledByStudio
    ? "<p>We apologise for the inconvenience. Reply to this email if you'd like to rebook.</p>"
    : '<p>You can book another workshop at <a href="https://book.palavara.com/">book.palavara.com</a> whenever you like.</p>';

  const ctx = {
    studentName: booking.studentName,
    dateLine,
    timeLine,
    bookingId:   booking.bookingId,
    lead,
    refundLine,
    closing,
    closingHtml,
  };

  const { subject, text, html } = renderTemplate('cancel-student', ctx);

  return sendWithIcs({
    to:          booking.studentEmail,
    subject,
    text,
    html,
    icsContent:  buildIcs(booking, { method: 'CANCEL', fromAddress: FROM_ADDRESS }),
    icsFilename: 'workshop-cancelled.ics',
    icsMethod:   'CANCEL',
    replyTo:     REPLY_TO,
    logTag:      'student-cancel',
    bookingId:   booking.bookingId,
  });
}

async function sendCancellationNotification(booking) {
  if (!FROM_ADDRESS || !OWNER_NOTIFY_ADDRESS) {
    console.warn('SES sender or OWNER_NOTIFY_ADDRESS not configured — skipping owner cancel email');
    return false;
  }

  const dateLine = formatDate(booking.date);
  const timeLine = `${booking.timeSlot} – ${booking.slotEnd}`;
  const refunded = (booking.refundedAmountCents || 0) > 0;
  const refundLine = refunded
    ? `Refund: ${formatPrice(booking.refundedAmountCents)} processed (PayPal refund id ${booking.paypalRefundId || '?'})`
    : 'Refund: none (cancellation within 48h of workshop)';

  const cancelledBy = booking.cancelledBy === 'studio' ? 'studio' : 'student';

  const ctx = {
    cancelledBy,
    studentName:  booking.studentName,
    studentEmail: booking.studentEmail,
    dateLine,
    timeLine,
    bookingId:    booking.bookingId,
    refundLine,
  };

  const { subject, text, html } = renderTemplate('cancel-owner', ctx);

  return sendWithIcs({
    to:          OWNER_NOTIFY_ADDRESS,
    subject,
    text,
    html,
    icsContent:  buildIcs(booking, { method: 'CANCEL', fromAddress: FROM_ADDRESS }),
    icsFilename: `cancel-${booking.bookingId.slice(0, 8)}.ics`,
    icsMethod:   'CANCEL',
    replyTo:     booking.studentEmail,
    logTag:      'owner-cancel',
    bookingId:   booking.bookingId,
  });
}

module.exports = {
  sendBookingConfirmation,
  sendOwnerNotification,
  sendCancellationConfirmation,
  sendCancellationNotification,
};
