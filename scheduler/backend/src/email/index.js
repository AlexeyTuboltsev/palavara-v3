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
  buildCycleIcs,
  buildGoogleCalendarUrl,
  buildCancelUrl,
} = require('./helpers');
const { sendWithIcs, FROM_ADDRESS } = require('./send');
const { renderTemplate } = require('./render');

const REPLY_TO             = process.env.SES_REPLY_TO;
const OWNER_NOTIFY_ADDRESS = process.env.OWNER_NOTIFY_ADDRESS;

// PNG (not SVG) is the only format Gmail / Outlook / Apple Mail
// universally render in <img> tags. Source SVG: scheduler/frontend/logo.svg;
// rasterized copy lives at public/logo.png and ships with the studio site.
const LOGO_URL  = 'https://studio.palavara.com/logo.png';
const STUDIO_URL = 'https://studio.palavara.com/';

// § 5/§ 6 TMG: commercial email must reference an Impressum. Static block
// appended below the booking-id line in every template. Update both halves
// in lockstep — text version is what plain-text mail clients render.
const IMPRESSUM_TEXT =
  '\n--\nPalavara Studio · Varvara Polyakova\n' +
  'Steegerstr. 1A, 13359 Berlin · palavarastudio@gmail.com\n' +
  'Impressum: https://studio.palavara.com/impressum · ' +
  'AGB: https://studio.palavara.com/agb · ' +
  'Datenschutz: https://studio.palavara.com/datenschutzerklaerung';

const IMPRESSUM_HTML =
  '<p style="color:#6b7280; font-size: 11px; line-height: 1.6; margin-top: 16px;">'
  + 'Palavara Studio · Varvara Polyakova<br/>'
  + 'Steegerstr. 1A, 13359 Berlin · '
  + '<a href="mailto:palavarastudio@gmail.com" style="color:#6b7280;">palavarastudio@gmail.com</a><br/>'
  + '<a href="https://studio.palavara.com/impressum" style="color:#6b7280;">Impressum</a> · '
  + '<a href="https://studio.palavara.com/agb" style="color:#6b7280;">AGB</a> · '
  + '<a href="https://studio.palavara.com/datenschutzerklaerung" style="color:#6b7280;">Datenschutzerklärung</a>'
  + '</p>';

/** Lesson type label snapshotted on the booking row (e.g. "Single lesson",
 *  "Group lesson"). Falls back to "Workshop" for legacy bookings that pre-date
 *  the lesson-types catalog. */
function lessonLabelOf(booking) {
  return booking.lessonTypeLabel || 'Workshop';
}

/** Pre-rendered "Phone" row blocks for owner emails. Empty strings when the
 *  booking has no phone, so the templates can splice them unconditionally. */
function phoneBlocks(booking) {
  const phone = (booking.studentPhone || '').trim();
  if (!phone) return { text: '', html: '' };
  return {
    text: `\n  Phone:      ${phone}`,
    html: `<tr><td style="color:#6b7280">Phone</td><td>${escapeHtml(phone)}</td></tr>`,
  };
}

/** Pre-rendered "Sessions" block for cycle emails. Text version is a
 *  monospace-friendly list, HTML version is table rows that slot inside
 *  the templates' existing <table>. Siblings come in any order; we sort
 *  by sessionIndex so "Session 1" reads correctly. */
function sessionBlocks(siblings) {
  const sorted = [...siblings].sort(
    (a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0)
  );
  const total = sorted.length;
  const textLines = sorted.map((s) => {
    const dateLine = formatDate(s.date);
    const timeLine = `${s.timeSlot} – ${s.slotEnd}`;
    return `  Session ${s.sessionIndex}/${total}: ${dateLine}, ${timeLine}`;
  });
  const htmlRows = sorted.map((s) => {
    const dateLine = formatDate(s.date);
    const timeLine = `${s.timeSlot} – ${s.slotEnd}`;
    return `<tr><td style="color:#6b7280">Session ${s.sessionIndex}/${total}</td>`
      + `<td><strong>${escapeHtml(dateLine)}</strong>, ${escapeHtml(timeLine)}</td></tr>`;
  });
  return {
    text: textLines.join('\n'),
    html: htmlRows.join(''),
  };
}

/** Pre-rendered "Comment" block. Multi-line, so it sits below the table
 *  rather than inside it. Empty strings when there's no comment. */
function commentBlocks(booking) {
  const comment = (booking.comment || '').trim();
  if (!comment) return { text: '', html: '' };
  return {
    text: `\n\nComment:\n  ${comment.replace(/\n/g, '\n  ')}`,
    html:
      '<p style="margin: 16px 0 4px; color:#6b7280; font-size: 13px;">Comment</p>' +
      `<p style="margin: 0; white-space: pre-wrap;">${escapeHtml(comment)}</p>`,
  };
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
    cancelUrl:         buildCancelUrl(booking),
    bookingId:         booking.bookingId,
    logoUrl:           LOGO_URL,
    studioUrl:         STUDIO_URL,
    lessonLabel,
    lessonLabelLower:  lessonLabel.toLowerCase(),
    priceLineIndented: showPrice ? `\n  ${priceLine}` : '',
    priceRowHtml:      showPrice
      ? `<tr><td style="color:#6b7280">Payment</td><td>${escapeHtml(priceLine)}</td></tr>`
      : '',
    impressumText:     IMPRESSUM_TEXT,
    impressumHtml:     IMPRESSUM_HTML,
  };

  const { subject, text, html } = renderTemplate('booking-student', ctx);

  // No .ics attachment for students — adds clutter and most clients
  // already have the booking on their calendar via PayPal/Google.
  return sendWithIcs({
    to:        booking.studentEmail,
    subject,
    text,
    html,
    replyTo:   REPLY_TO,
    logTag:    'student',
    bookingId: booking.bookingId,
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
    logoUrl:             LOGO_URL,
    studioUrl:           STUDIO_URL,
    paymentNoteIndented: note ? `\n  Note:       ${note}` : '',
    paymentNoteRowHtml:  note
      ? `<tr><td style="color:#6b7280">Note</td><td>${escapeHtml(note)}</td></tr>`
      : '',
    impressumText:       IMPRESSUM_TEXT,
    impressumHtml:       IMPRESSUM_HTML,
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
    const phone   = phoneBlocks(booking);
    const cmt     = commentBlocks(booking);
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
      phoneBlockText:    phone.text,
      phoneRowHtml:      phone.html,
      commentBlockText:  cmt.text,
      commentBlockHtml:  cmt.html,
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
    : 'No refund — cancellations less than 7 days before the workshop are not refundable. The slot has been released for other bookings.';

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
    logoUrl:     LOGO_URL,
    studioUrl:   STUDIO_URL,
    lead,
    refundLine,
    closing,
    closingHtml,
    impressumText: IMPRESSUM_TEXT,
    impressumHtml: IMPRESSUM_HTML,
  };

  const { subject, text, html } = renderTemplate('cancel-student', ctx);

  // No .ics attachment — see sendBookingConfirmation.
  return sendWithIcs({
    to:        booking.studentEmail,
    subject,
    text,
    html,
    replyTo:   REPLY_TO,
    logTag:    'student-cancel',
    bookingId: booking.bookingId,
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
    : 'Refund: none (cancellation less than 7 days before the workshop)';

  const cancelledBy = booking.cancelledBy === 'studio' ? 'studio' : 'student';

  const ctx = {
    cancelledBy,
    studentName:  booking.studentName,
    studentEmail: booking.studentEmail,
    dateLine,
    timeLine,
    bookingId:    booking.bookingId,
    logoUrl:      LOGO_URL,
    studioUrl:    STUDIO_URL,
    refundLine,
    impressumText: IMPRESSUM_TEXT,
    impressumHtml: IMPRESSUM_HTML,
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

// ── 4-session cycle senders ───────────────────────────────────────────────
//
// Each takes the array of cycle siblings (typically N=4 rows sharing one
// cycleId). All siblings carry the same shared fields (studentName, email,
// lessonType, amountCents, paypalOrderId/CaptureId, etc.); per-row fields
// are only the slot timing + sessionIndex.

/** Pick the row used as "the booking" for shared fields. Sorted by
 *  sessionIndex so the bookingId we emit in the email is always session-1's. */
function cycleLead(siblings) {
  return [...siblings].sort(
    (a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0)
  )[0];
}

async function sendCycleBookingConfirmation(siblings) {
  if (!FROM_ADDRESS) {
    console.warn('SES_FROM_ADDRESS not configured — skipping cycle student email');
    return false;
  }
  if (!Array.isArray(siblings) || siblings.length === 0) return false;
  const lead = cycleLead(siblings);
  if (!lead?.studentEmail) return false;

  const sessions   = sessionBlocks(siblings);
  const priceLine  = priceLineText(lead);
  const showPrice  = (lead.amountCents ?? 0) > 0;
  const lessonLabel = lessonLabelOf(lead);

  const ctx = {
    studentName:       lead.studentName,
    studioAddress:     STUDIO_ADDRESS,
    cancelUrl:         buildCancelUrl(lead),
    bookingId:         lead.bookingId,
    logoUrl:           LOGO_URL,
    studioUrl:         STUDIO_URL,
    lessonLabel,
    lessonLabelLower:  lessonLabel.toLowerCase(),
    sessionsText:      sessions.text,
    sessionsHtml:      sessions.html,
    priceLineIndented: showPrice ? `\n  ${priceLine}` : '',
    priceRowHtml:      showPrice
      ? `<tr><td style="color:#6b7280">Payment</td><td>${escapeHtml(priceLine)}</td></tr>`
      : '',
    impressumText:     IMPRESSUM_TEXT,
    impressumHtml:     IMPRESSUM_HTML,
  };

  const { subject, text, html } = renderTemplate('booking-student-cycle', ctx);

  return sendWithIcs({
    to:          lead.studentEmail,
    subject,
    text,
    html,
    icsContent:  buildCycleIcs(siblings, { fromAddress: FROM_ADDRESS }),
    icsFilename: 'cycle.ics',
    replyTo:     REPLY_TO,
    logTag:      'student-cycle',
    bookingId:   lead.bookingId,
  });
}

async function sendCycleOwnerNotification(siblings) {
  if (!FROM_ADDRESS || !OWNER_NOTIFY_ADDRESS) {
    console.warn('SES sender or OWNER_NOTIFY_ADDRESS not configured — skipping cycle owner email');
    return false;
  }
  if (!Array.isArray(siblings) || siblings.length === 0) return false;
  const lead = cycleLead(siblings);

  const sessions  = sessionBlocks(siblings);
  const priceLine = priceLineText(lead);
  const showPrice = (lead.amountCents ?? 0) > 0;
  const lessonLabel = lessonLabelOf(lead);
  const phone     = phoneBlocks(lead);
  const cmt       = commentBlocks(lead);

  const ctx = {
    studentName:       lead.studentName,
    studentEmail:      lead.studentEmail,
    cancelUrl:         buildCancelUrl(lead),
    bookingId:         lead.bookingId,
    logoUrl:           LOGO_URL,
    studioUrl:         STUDIO_URL,
    lessonLabel,
    lessonLabelLower:  lessonLabel.toLowerCase(),
    sessionsText:      sessions.text,
    sessionsHtml:      sessions.html,
    priceLineIndented: showPrice ? `\n  ${priceLine}` : '',
    priceRowHtml:      showPrice
      ? `<tr><td style="color:#6b7280">Payment</td><td>${escapeHtml(priceLine)}</td></tr>`
      : '',
    phoneBlockText:    phone.text,
    phoneRowHtml:      phone.html,
    commentBlockText:  cmt.text,
    commentBlockHtml:  cmt.html,
    impressumText:     IMPRESSUM_TEXT,
    impressumHtml:     IMPRESSUM_HTML,
  };

  const { subject, text, html } = renderTemplate('booking-owner-cycle', ctx);

  return sendWithIcs({
    to:          OWNER_NOTIFY_ADDRESS,
    subject,
    text,
    html,
    icsContent:  buildCycleIcs(siblings, { fromAddress: FROM_ADDRESS }),
    icsFilename: `cycle-${(lead.cycleId || '').slice(0, 8)}.ics`,
    replyTo:     lead.studentEmail || undefined,
    logTag:      'owner-cycle',
    bookingId:   lead.bookingId,
  });
}

async function sendCycleCancellationConfirmation(siblings) {
  if (!FROM_ADDRESS) {
    console.warn('SES_FROM_ADDRESS not configured — skipping cycle student cancel email');
    return false;
  }
  if (!Array.isArray(siblings) || siblings.length === 0) return false;
  const lead = cycleLead(siblings);

  const sessions = sessionBlocks(siblings);
  const refunded = (lead.refundedAmountCents || 0) > 0;
  const refundLine = refunded
    ? `${formatPrice(lead.refundedAmountCents)} has been refunded to your PayPal account.`
    : 'No refund — cancellations less than 7 days before the first session are not refundable.';

  const cancelledByStudio = lead.cancelledBy === 'studio';
  const lessonLabelLower  = lessonLabelOf(lead).toLowerCase();
  const lead_msg = cancelledByStudio
    ? `Your ${lessonLabelLower} has been cancelled by the studio.`
    : `Your ${lessonLabelLower} has been cancelled.`;
  const closing = cancelledByStudio
    ? "We apologise for the inconvenience. Reply to this email if you'd like to rebook."
    : 'You can book another workshop at https://book.palavara.com/ whenever you like.';
  const closingHtml = cancelledByStudio
    ? "<p>We apologise for the inconvenience. Reply to this email if you'd like to rebook.</p>"
    : '<p>You can book another workshop at <a href="https://book.palavara.com/">book.palavara.com</a> whenever you like.</p>';

  const ctx = {
    studentName:   lead.studentName,
    bookingId:     lead.bookingId,
    logoUrl:       LOGO_URL,
    studioUrl:     STUDIO_URL,
    lead:          lead_msg,
    refundLine,
    closing,
    closingHtml,
    sessionsText:  sessions.text,
    sessionsHtml:  sessions.html,
    impressumText: IMPRESSUM_TEXT,
    impressumHtml: IMPRESSUM_HTML,
  };

  const { subject, text, html } = renderTemplate('cancel-student-cycle', ctx);

  return sendWithIcs({
    to:          lead.studentEmail,
    subject,
    text,
    html,
    icsContent:  buildCycleIcs(siblings, { method: 'CANCEL', fromAddress: FROM_ADDRESS }),
    icsFilename: 'cycle-cancelled.ics',
    icsMethod:   'CANCEL',
    replyTo:     REPLY_TO,
    logTag:      'student-cycle-cancel',
    bookingId:   lead.bookingId,
  });
}

async function sendCycleCancellationNotification(siblings) {
  if (!FROM_ADDRESS || !OWNER_NOTIFY_ADDRESS) {
    console.warn('SES sender or OWNER_NOTIFY_ADDRESS not configured — skipping cycle owner cancel email');
    return false;
  }
  if (!Array.isArray(siblings) || siblings.length === 0) return false;
  const lead = cycleLead(siblings);

  const sessions = sessionBlocks(siblings);
  const refunded = (lead.refundedAmountCents || 0) > 0;
  const refundLine = refunded
    ? `Refund: ${formatPrice(lead.refundedAmountCents)} processed (PayPal refund id ${lead.paypalRefundId || '?'})`
    : 'Refund: none (cancellation less than 7 days before the first session)';
  const cancelledBy = lead.cancelledBy === 'studio' ? 'studio' : 'student';

  const ctx = {
    cancelledBy,
    studentName:  lead.studentName,
    studentEmail: lead.studentEmail,
    bookingId:    lead.bookingId,
    logoUrl:      LOGO_URL,
    studioUrl:    STUDIO_URL,
    refundLine,
    sessionsText: sessions.text,
    sessionsHtml: sessions.html,
    impressumText: IMPRESSUM_TEXT,
    impressumHtml: IMPRESSUM_HTML,
  };

  const { subject, text, html } = renderTemplate('cancel-owner-cycle', ctx);

  return sendWithIcs({
    to:          OWNER_NOTIFY_ADDRESS,
    subject,
    text,
    html,
    icsContent:  buildCycleIcs(siblings, { method: 'CANCEL', fromAddress: FROM_ADDRESS }),
    icsFilename: `cycle-cancel-${(lead.cycleId || '').slice(0, 8)}.ics`,
    icsMethod:   'CANCEL',
    replyTo:     lead.studentEmail,
    logTag:      'owner-cycle-cancel',
    bookingId:   lead.bookingId,
  });
}

module.exports = {
  sendBookingConfirmation,
  sendOwnerNotification,
  sendCancellationConfirmation,
  sendCancellationNotification,
  sendCycleBookingConfirmation,
  sendCycleOwnerNotification,
  sendCycleCancellationConfirmation,
  sendCycleCancellationNotification,
};
