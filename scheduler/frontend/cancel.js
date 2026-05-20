/**
 * Palavara Scheduler — cancellation page (cancel.js)
 *
 * Flow:
 *  1. Read ?bookingId=...&token=... from URL.
 *  2. GET /bookings/{id} to display the workshop the user is about to cancel.
 *  3. Show a confirmation prompt with refund-eligibility context.
 *  4. On confirm, POST /bookings/{id}/cancel?token=... and render the result.
 *
 * Refund eligibility is decided server-side. The page only computes a
 * provisional indication for the prompt — the server's response is what
 * determines whether the refund actually happened.
 *
 * All visible strings come from i18next; init runs from `window.boot()`.
 */

'use strict';

const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';

// Must match scheduler/backend/src/utils/cancelLogic.js's REFUND_WINDOW_DAYS
// and the calendar-day arithmetic. Anything else and the cancel page promises
// a refund the backend then refuses (or vice versa).
const REFUND_WINDOW_DAYS = 7;

const t = (...args) => window.i18next ? window.i18next.t(...args) : args[0];

const stepLoading    = document.getElementById('step-loading');
const stepConfirm    = document.getElementById('step-confirm');
const stepCancelling = document.getElementById('step-cancelling');
const stepCancelled  = document.getElementById('step-cancelled');
const stepError      = document.getElementById('step-error');
const bookingDetails  = document.getElementById('bookingDetails');
const refundNotice    = document.getElementById('refundNotice');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const cancelledMessage = document.getElementById('cancelledMessage');
const errorMsg         = document.getElementById('errorMsg');

function showStep(step) {
  [stepLoading, stepConfirm, stepCancelling, stepCancelled, stepError].forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  step.classList.remove('hidden');
  step.classList.add('active');
}

function showError(msg) {
  errorMsg.textContent = msg || t('cancel.errors.generic');
  showStep(stepError);
}

function uiLocale() {
  return (window.i18next && window.i18next.resolvedLanguage) || 'en';
}

function formatDate(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString(uiLocale(), {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatRange(start, end) {
  return `${start} – ${end}`;
}

/** Calendar-day diff between "today in Europe/Berlin" and a YYYY-MM-DD
 * session date. Returns sessionDate - today in whole days, ignoring
 * time-of-day. Mirrors cancelLogic.daysUntilSessionDate on the backend. */
function daysUntilSessionDate(dateYmd, nowMs = Date.now()) {
  if (!dateYmd) return NaN;
  const parts = dateYmd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return NaN;
  const [y, m, d] = parts;
  const sessionUtc = Date.UTC(y, m - 1, d);
  const todayYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' })
    .format(new Date(nowMs));
  const [ty, tm, td] = todayYmd.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((sessionUtc - todayUtc) / 86_400_000);
}

function isLikelyRefundEligible(booking) {
  if (!booking?.date) return false;
  // Cycles: eligibility is measured against the EARLIEST session, not the
  // row the user happened to click on. cycleSiblings is included in the
  // GET /bookings/{id} response when cycleId is set.
  let targetDate = booking.date;
  if (booking.cycleId && Array.isArray(booking.cycleSiblings) && booking.cycleSiblings.length > 0) {
    targetDate = booking.cycleSiblings
      .map((s) => s.date)
      .filter(Boolean)
      .sort()[0] || booking.date;
  }
  return daysUntilSessionDate(targetDate) >= REFUND_WINDOW_DAYS;
}

function renderBookingDetails(booking) {
  const price = `€${((booking.amountCents || 0) / 100).toFixed(2)}`;
  const baseLabel = booking.lessonTypeLabel || 'Workshop';
  const detailsLabel = booking.numPersons && booking.numPersons > 1
    ? `${baseLabel} · ${t('confirm.personsSuffix', { count: booking.numPersons })}`
    : baseLabel;

  const rows = [
    { label: t('confirm.details.lessonType'), value: detailsLabel },
    { label: t('confirm.details.date'),       value: formatDate(booking.date) },
    { label: t('confirm.details.time'),       value: formatRange(booking.timeSlot, booking.slotEnd) },
    { label: t('confirm.details.paid'),       value: price },
    { label: t('confirm.details.bookingId'),  value: `<code>${booking.bookingId}</code>` },
  ];
  bookingDetails.innerHTML = rows.map((r) =>
    `<div class="confirm-row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`
  ).join('');
}

async function init() {
  const params    = new URLSearchParams(window.location.search);
  const bookingId = params.get('bookingId');
  const token     = params.get('token');

  if (!bookingId || !token) {
    showError(t('cancel.errors.missingParams'));
    return;
  }

  let booking;
  try {
    const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server error ${res.status}`);
    }
    booking = await res.json();
  } catch (err) {
    showError(err.message || t('cancel.errors.loadFailed'));
    return;
  }

  if (booking.status === 'cancelled') {
    cancelledMessage.textContent = t('cancel.alreadyCancelled');
    showStep(stepCancelled);
    return;
  }
  if (booking.status !== 'confirmed') {
    showError(t('cancel.errors.wrongStatus', { status: booking.status }));
    return;
  }

  renderBookingDetails(booking);

  if (isLikelyRefundEligible(booking)) {
    refundNotice.textContent = t('cancel.refundEligible');
    refundNotice.classList.add('refund-eligible');
  } else {
    refundNotice.textContent = t('cancel.refundLate');
    refundNotice.classList.add('refund-late');
  }

  confirmCancelBtn.addEventListener('click', () => doCancel(bookingId, token));

  showStep(stepConfirm);
}

async function doCancel(bookingId, token) {
  showStep(stepCancelling);

  try {
    const res = await fetch(
      `${API_BASE}/bookings/${encodeURIComponent(bookingId)}/cancel?token=${encodeURIComponent(token)}`,
      { method: 'POST' }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Server error ${res.status}`);

    const refunded = (body.refundedAmountCents || 0) > 0;
    cancelledMessage.textContent = refunded
      ? t('cancel.cancelledMessageRefunded', {
          amount: `€${(body.refundedAmountCents / 100).toFixed(2)}`,
        })
      : t('cancel.cancelledMessage');

    showStep(stepCancelled);
  } catch (err) {
    showError(err.message || t('cancel.errors.cancelFailed'));
  }
}

window.boot = init;
