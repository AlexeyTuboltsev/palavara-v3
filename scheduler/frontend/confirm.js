/**
 * Palavara Scheduler — confirmation page script (confirm.js)
 *
 * Flow:
 *  1. On page load, read ?bookingId=... from the URL (set by PayPal return URL).
 *  2. Poll GET /bookings/{id} until status = "confirmed" (max 10 attempts × 3s).
 *  3. Display confirmation details or "payment pending" message.
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

function formatSlotRange(slot) {
  const [h, m] = slot.split(':').map(Number);
  const end = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return `${slot} – ${end}`;
}

function renderConfirmedDetails(booking) {
  confirmDetails.innerHTML = `
    📅 ${formatDate(booking.date)}
    &nbsp;&nbsp;⏰ ${formatSlotRange(booking.timeSlot)}
    &nbsp;&nbsp;💶 €${(booking.amountCents / 100).toFixed(2)}
    <br/><small style="color:#6b7280">Booking ID: ${booking.bookingId}</small>
  `;
}

async function fetchBooking(bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error ${res.status}`);
  }
  return res.json();
}

async function pollUntilConfirmed(bookingId, maxAttempts = 10, intervalMs = 3000) {
  for (let i = 0; i < maxAttempts; i++) {
    const booking = await fetchBooking(bookingId);
    if (booking.status === 'confirmed') return booking;
    if (booking.status === 'cancelled') throw new Error('This booking has been cancelled.');
    // Still pending — wait and retry
    if (i < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  return null; // still pending after max attempts
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('bookingId');

  if (!bookingId) {
    showStep(stepError);
    errorMsg.textContent = 'No booking ID found in the URL. Did you come from a PayPal payment?';
    return;
  }

  showStep(stepVerifying);

  try {
    const booking = await pollUntilConfirmed(bookingId);

    if (booking) {
      renderConfirmedDetails(booking);
      showStep(stepConfirmed);
    } else {
      // Still pending after polling — show pending state
      pendingBookingId.textContent = bookingId;
      showStep(stepPending);
    }
  } catch (err) {
    showStep(stepError);
    errorMsg.textContent = err.message || 'Unable to verify your booking. Please contact support.';
  }
}

// Refresh button re-runs the check
refreshBtn.addEventListener('click', init);

// Start on page load
init();
