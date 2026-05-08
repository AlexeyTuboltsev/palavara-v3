/**
 * Palavara Scheduler — confirmation page script (confirm.js)
 *
 * Flow (PayPal Orders v2):
 *  1. Read ?bookingId=... from the URL (we appended it to the return URL
 *     when creating the order; PayPal also adds ?token=ORDERID&PayerID=...).
 *  2. Call POST /bookings/{id}/capture — captures the payment server-side
 *     and flips the booking to 'confirmed' synchronously.
 *  3. If capture succeeds, render the confirmed details.
 *  4. If capture fails (webhook beat us, network glitch), poll
 *     GET /bookings/{id} for a few seconds.
 *
 * All visible strings come from i18next (locales/<lng>/translation.json).
 * The init runs from `window.boot()`, called by i18n.js once translations
 * are ready.
 */

'use strict';

const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';

const t = (...args) => window.i18next ? window.i18next.t(...args) : args[0];

const stepVerifying = document.getElementById('step-verifying');
const stepConfirmed = document.getElementById('step-confirmed');
const stepPending   = document.getElementById('step-pending');
const stepError     = document.getElementById('step-error');
const confirmMessage  = document.getElementById('confirmMessage');
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

function uiLocale() {
  return (window.i18next && window.i18next.resolvedLanguage) || 'en';
}

function formatDate(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString(uiLocale(), {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatSlotRange(start, end) {
  return `${start} – ${end}`;
}

function renderConfirmedDetails(booking) {
  const price = `€${((booking.amountCents || 0) / 100).toFixed(2)}`;
  const baseLabel = booking.lessonTypeLabel || 'Workshop';
  const detailsLabel = booking.numPersons && booking.numPersons > 1
    ? `${baseLabel} · ${t('confirm.personsSuffix', { count: booking.numPersons })}`
    : baseLabel;

  const rows = [
    { label: t('confirm.details.lessonType'), value: detailsLabel },
    { label: t('confirm.details.date'),       value: formatDate(booking.date) },
    { label: t('confirm.details.time'),       value: formatSlotRange(booking.timeSlot, booking.slotEnd) },
    { label: t('confirm.details.paid'),       value: price },
    { label: t('confirm.details.bookingId'),  value: `<code>${booking.bookingId}</code>` },
  ];
  confirmDetails.innerHTML = rows.map((r) =>
    `<div class="confirm-row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`
  ).join('');

  confirmMessage.textContent = t('confirm.messageWithLabel', { lessonLabel: baseLabel.toLowerCase() });
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
  // call and renders the corresponding state with mock data.
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
    errorMsg.textContent = t('confirm.errors.noBookingId');
    return;
  }

  showStep(stepVerifying);

  try {
    const booking = await captureBooking(bookingId);
    if (booking.status === 'confirmed') {
      renderConfirmedDetails(booking);
      showStep(stepConfirmed);
      return;
    }
  } catch (err) {
    console.warn('capture call failed, falling back to polling:', err);
  }

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
    errorMsg.textContent = err.message || t('confirm.errors.verifyFailed');
  }
}

refreshBtn.addEventListener('click', init);

window.boot = init;
