/**
 * Palavara Scheduler — confirmation page script (confirm.js)
 *
 * Flow (PayPal Orders v2):
 *  1. Read ?bookingId=... from the URL (we appended it to the return URL
 *     when creating the order; PayPal also adds ?token=ORDERID&PayerID=...).
 *  2. Call POST /bookings/{id}/capture — this captures the payment server-side
 *     and flips the booking to 'confirmed' synchronously.
 *  3. If capture succeeds, render the confirmed details.
 *  4. If capture fails (e.g. webhook beat us, network glitch), fall back to
 *     polling GET /bookings/{id} for a few seconds.
 */

'use strict';

const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';

const stepVerifying = document.getElementById('step-verifying');
const stepConfirmed = document.getElementById('step-confirmed');
const stepPending   = document.getElementById('step-pending');
const stepError     = document.getElementById('step-error');
const confirmDetails  = document.getElementById('confirmDetails');
const pendingBookingId = document.getElementById('pendingBookingId');
const errorMsg      = document.getElementById('errorMsg');
const refreshBtn    = document.getElementById('refreshBtn');

function showStep(step) {
  [stepVerifying, stepConfirmed, stepPending, stepError].forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  step.classList.remove('hidden');
  step.classList.add('active');
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatSlotRange(start, end) {
  return `${start} – ${end}`;
}

function renderConfirmedDetails(booking) {
  const price = `€${((booking.amountCents || 0) / 100).toFixed(2)}`;
  // Compose a human label for the lesson type. Falls back to '—' if the
  // backend hasn't stored it yet.
  let lessonLabel = '—';
  if (booking.lessonTypeLabel) {
    lessonLabel = booking.numPersons && booking.numPersons > 1
      ? `${booking.lessonTypeLabel} · ${booking.numPersons} people`
      : booking.lessonTypeLabel;
  }
  confirmDetails.innerHTML = `
    <div class="confirm-row"><span class="label">Lesson type</span><span class="value">${lessonLabel}</span></div>
    <div class="confirm-row"><span class="label">Date</span><span class="value">${formatDate(booking.date)}</span></div>
    <div class="confirm-row"><span class="label">Time</span><span class="value">${formatSlotRange(booking.timeSlot, booking.slotEnd)}</span></div>
    <div class="confirm-row"><span class="label">Paid</span><span class="value">${price}</span></div>
    <div class="confirm-row"><span class="label">Booking ID</span><span class="value"><code>${booking.bookingId}</code></span></div>
  `;
}

async function captureBooking(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}/capture`, {
    method: 'POST',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Server error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function fetchBooking(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error ${res.status}`);
  }
  return res.json();
}

async function pollUntilConfirmed(bookingId, maxAttempts = 8, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const booking = await fetchBooking(bookingId);
    if (booking.status === 'confirmed') return booking;
    if (booking.status === 'cancelled') throw new Error('This booking has been cancelled.');
    if (i < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  return null;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('bookingId');

  // Preview mode: ?preview=confirmed | pending | error — skips the API
  // call and renders the corresponding state with mock data. Useful for
  // designing the page without making a real booking.
  const preview = params.get('preview');
  if (preview) {
    if (preview === 'confirmed') {
      renderConfirmedDetails({
        bookingId: 'preview-0000-0000-0000-aaaa',
        date: '2026-05-22',
        timeSlot: '14:00',
        slotEnd: '16:00',
        amountCents: 9500,
        lessonTypeLabel: 'Single lesson',
        numPersons: 1,
      });
      showStep(stepConfirmed);
    } else if (preview === 'pending') {
      pendingBookingId.textContent = 'preview-0000-0000-0000-aaaa';
      showStep(stepPending);
    } else {
      errorMsg.textContent = 'Preview: an example error message would appear here.';
      showStep(stepError);
    }
    return;
  }

  if (!bookingId) {
    showStep(stepError);
    errorMsg.textContent = 'No booking ID found in the URL. Did you come from a PayPal payment?';
    return;
  }

  showStep(stepVerifying);

  // Try the synchronous capture first.
  try {
    const booking = await captureBooking(bookingId);
    if (booking.status === 'confirmed') {
      renderConfirmedDetails(booking);
      showStep(stepConfirmed);
      return;
    }
  } catch (err) {
    // Capture might fail because the webhook already confirmed it, the
    // network blipped, etc. Fall through to polling.
    console.warn('capture call failed, falling back to polling:', err);
  }

  // Fall-back: poll until the webhook flips the booking to confirmed.
  try {
    const booking = await pollUntilConfirmed(bookingId);
    if (booking) {
      renderConfirmedDetails(booking);
      showStep(stepConfirmed);
    } else {
      pendingBookingId.textContent = bookingId;
      showStep(stepPending);
    }
  } catch (err) {
    showStep(stepError);
    errorMsg.textContent = err.message || 'Unable to verify your booking. Please contact support.';
  }
}

refreshBtn.addEventListener('click', init);
init();
