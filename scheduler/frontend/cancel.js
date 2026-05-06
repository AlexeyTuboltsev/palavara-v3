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
 */

'use strict';

const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';

const REFUND_WINDOW_MS = 48 * 60 * 60 * 1000;

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
  errorMsg.textContent = msg || 'We couldn\'t process this cancellation.';
  showStep(stepError);
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatRange(start, end) {
  return `${start} – ${end}`;
}

function isLikelyRefundEligible(booking) {
  if (!booking?.date || !booking?.timeSlot) return false;
  // Berlin local + CEST in May is UTC+2; this is a UI-side estimate only.
  const startMs = Date.parse(`${booking.date}T${booking.timeSlot}:00+02:00`);
  if (isNaN(startMs)) return false;
  return startMs - Date.now() > REFUND_WINDOW_MS;
}

async function init() {
  const params    = new URLSearchParams(window.location.search);
  const bookingId = params.get('bookingId');
  const token     = params.get('token');

  if (!bookingId || !token) {
    showError('This cancellation link is missing required information. Please use the link from your confirmation email.');
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
    showError(err.message || 'Could not load this booking.');
    return;
  }

  if (booking.status === 'cancelled') {
    cancelledMessage.textContent = 'This booking was already cancelled.';
    showStep(stepCancelled);
    return;
  }
  if (booking.status !== 'confirmed') {
    showError(`This booking can't be cancelled — it has status "${booking.status}".`);
    return;
  }

  bookingDetails.innerHTML = `
    ${formatDate(booking.date)}
    &nbsp;·&nbsp; ${formatRange(booking.timeSlot, booking.slotEnd)}
    &nbsp;·&nbsp; €${(booking.amountCents / 100).toFixed(2)}
  `;

  if (isLikelyRefundEligible(booking)) {
    refundNotice.textContent = 'This is more than 48 hours before the workshop, so you will receive a full refund.';
    refundNotice.classList.add('refund-eligible');
  } else {
    refundNotice.textContent = 'This is within 48 hours of the workshop. Per the cancellation policy, no refund will be issued, but the slot will be released.';
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
      ? `Your booking has been cancelled and €${(body.refundedAmountCents / 100).toFixed(2)} has been refunded to your PayPal account.`
      : 'Your booking has been cancelled. No refund per the >48h policy.';

    showStep(stepCancelled);
  } catch (err) {
    showError(err.message || 'Cancellation failed. Please try again or email palavarastudio@gmail.com.');
  }
}

init();
