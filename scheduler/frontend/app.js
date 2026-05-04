/**
 * Palavara Scheduler — main booking page script (app.js)
 *
 * Flow:
 *  1. User picks a date → fetch available slots from API
 *  2. User picks a slot → show booking form
 *  3. User fills name + email → POST /bookings → redirect to PayPal
 */

'use strict';

// ── Config ─────────────────────────────────────────────────────────────────
const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';

// ── DOM refs ───────────────────────────────────────────────────────────────
const stepDate    = document.getElementById('step-date');
const stepSlots   = document.getElementById('step-slots');
const stepForm    = document.getElementById('step-form');
const datePicker  = document.getElementById('datePicker');
const loadSlotsBtn  = document.getElementById('loadSlotsBtn');
const slotsGrid   = document.getElementById('slotsGrid');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const summaryDate = document.getElementById('summaryDate');
const summarySlot = document.getElementById('summarySlot');
const backToDateBtn  = document.getElementById('backToDateBtn');
const backToSlotsBtn = document.getElementById('backToSlotsBtn');
const bookingForm = document.getElementById('bookingForm');
const bookBtn     = document.getElementById('bookBtn');
const dateError   = document.getElementById('dateError');
const slotsError  = document.getElementById('slotsError');
const formError   = document.getElementById('formError');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMsg  = document.getElementById('loadingMsg');

// ── State ──────────────────────────────────────────────────────────────────
let selectedDate = '';
let selectedSlot = '';

// ── Helpers ────────────────────────────────────────────────────────────────
function showStep(step) {
  [stepDate, stepSlots, stepForm].forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  step.classList.remove('hidden');
  step.classList.add('active');
}

function showLoading(msg = 'Loading…') {
  loadingMsg.textContent = msg;
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}

/** Format YYYY-MM-DD as a human-readable string, e.g. "Tuesday, 20 May 2025" */
function formatDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/** Format HH:MM as "10:00 – 11:00" */
function formatSlotRange(slot) {
  const [h, m] = slot.split(':').map(Number);
  const end = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return `${slot} – ${end}`;
}

// ── Set min date on the picker (today) ────────────────────────────────────
(function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  datePicker.min = today;
  datePicker.value = today;
})();

// ── Step 1 → Step 2: load slots ────────────────────────────────────────────
loadSlotsBtn.addEventListener('click', async () => {
  hideError(dateError);
  const date = datePicker.value;
  if (!date) {
    showError(dateError, 'Please pick a date first.');
    return;
  }

  showLoading('Checking availability…');

  try {
    const res = await fetch(`${API_BASE}/availability?date=${encodeURIComponent(date)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server error ${res.status}`);
    }
    const data = await res.json();

    selectedDate = date;
    selectedDateLabel.textContent = formatDate(date);
    renderSlots(data.availableSlots || []);
    showStep(stepSlots);
  } catch (err) {
    showError(dateError, err.message || 'Failed to load availability. Please try again.');
  } finally {
    hideLoading();
  }
});

// Allow pressing Enter in the date field
datePicker.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadSlotsBtn.click();
});

// ── Render slot buttons ────────────────────────────────────────────────────
function renderSlots(availableSlots) {
  slotsGrid.innerHTML = '';

  if (availableSlots.length === 0) {
    slotsGrid.innerHTML = '<p class="no-slots-msg">No slots available for this date. Please try another day.</p>';
    return;
  }

  availableSlots.forEach(slot => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = formatSlotRange(slot);
    btn.dataset.slot = slot;
    btn.addEventListener('click', () => selectSlot(slot, btn));
    slotsGrid.appendChild(btn);
  });
}

function selectSlot(slot, btn) {
  // Deselect any previously selected slot
  slotsGrid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedSlot = slot;

  // Update summary and move to form step
  summaryDate.textContent = formatDate(selectedDate);
  summarySlot.textContent = formatSlotRange(slot);
  showStep(stepForm);
  document.getElementById('studentName').focus();
}

// ── Back buttons ───────────────────────────────────────────────────────────
backToDateBtn.addEventListener('click', () => {
  selectedSlot = '';
  showStep(stepDate);
});

backToSlotsBtn.addEventListener('click', () => {
  selectedSlot = '';
  showStep(stepSlots);
});

// ── Step 3: Submit booking ─────────────────────────────────────────────────
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(formError);

  const studentName  = document.getElementById('studentName').value.trim();
  const studentEmail = document.getElementById('studentEmail').value.trim();

  // Client-side validation
  if (!studentName || studentName.length < 2) {
    showError(formError, 'Please enter your full name (at least 2 characters).');
    document.getElementById('studentName').focus();
    return;
  }
  if (!studentEmail || !studentEmail.includes('@')) {
    showError(formError, 'Please enter a valid email address.');
    document.getElementById('studentEmail').focus();
    return;
  }
  if (!selectedDate || !selectedSlot) {
    showError(formError, 'Missing date or time slot. Please go back and select again.');
    return;
  }

  bookBtn.disabled = true;
  showLoading('Creating your booking…');

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, timeSlot: selectedSlot, studentName, studentEmail }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Server error ${res.status}`);
    }

    if (!data.paypalUrl) {
      throw new Error('No payment URL returned. Please try again.');
    }

    // Redirect to PayPal
    window.location.href = data.paypalUrl;
  } catch (err) {
    hideLoading();
    bookBtn.disabled = false;
    showError(formError, err.message || 'Failed to create booking. Please try again.');
  }
});
