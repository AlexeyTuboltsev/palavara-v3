/**
 * Palavara Scheduler — main booking page script (app.js)
 *
 * Desktop:
 *   1. Calendar with slots rendered inside each day cell.
 *   2. Click a slot → form (step 3).
 *
 * Mobile (≤ 600 px):
 *   1. Vertical list of dates that have workshops.
 *   2. Tap a date → step 2 with that date's slots.
 *   3. Tap a slot → form (step 3).
 *
 * Each step has a close × (top-right) and a Cancel (bottom-right).
 * Steps 2 and 3 also have Back (bottom-left). Cancel and × call
 * history.back() if the user came from another page, otherwise navigate
 * to the studio home.
 */

'use strict';

// ── Config ─────────────────────────────────────────────────────────────────
const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';
const STUDIO_URL = 'https://studio.palavara.com/';

// ── DOM refs ───────────────────────────────────────────────────────────────
const stepDate    = document.getElementById('step-date');
const stepForm    = document.getElementById('step-form');
const calendarGrid = document.getElementById('calendarGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const dateList = document.getElementById('dateList');
const summaryDate = document.getElementById('summaryDate');
const summarySlot = document.getElementById('summarySlot');
const bookingForm = document.getElementById('bookingForm');
const bookBtn     = document.getElementById('bookBtn');
const dateError   = document.getElementById('dateError');
const formError   = document.getElementById('formError');
const headerTitle = document.getElementById('headerTitle');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMsg  = document.getElementById('loadingMsg');

const STEPS = [stepDate, stepForm];

// ── State ──────────────────────────────────────────────────────────────────
let availableDates = [];               // array of YYYY-MM-DD strings, sorted
let availableDateSet = new Set();
let slotsByDate = {};                  // { 'YYYY-MM-DD': [{start,end}, ...] }
let lessonTypes = [];                  // [{id, label, pricePerPersonCents, minPersons, maxPersons}, ...]
let calendarYear  = 0;
let calendarMonth = 0;                 // 0-indexed
let selectedDate = '';
let selectedStart = '';
let selectedEnd   = '';

// ── Helpers ────────────────────────────────────────────────────────────────
function showStep(step) {
  STEPS.forEach((s) => {
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
function hideLoading() { loadingOverlay.classList.add('hidden'); }

function showError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
function hideError(el)      { el.classList.add('hidden'); el.textContent = ''; }

function formatDateLong(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
function formatWeekday(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long' });
}
function formatDateShort(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
function formatSlotRange(slot) { return `${slot.start} – ${slot.end}`; }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function dateToIso(year, month, day) { return `${year}-${pad2(month + 1)}-${pad2(day)}`; }

function isDesktop() { return window.matchMedia('(min-width: 601px)').matches; }

// ── On load: fetch the whole calendar in one request ─────────────────────
// The /dates endpoint now returns { dates: [...], calendar: [{date, slots}, ...] }
// — slots already filtered for what's still available — so one round-trip
// covers both desktop (renders slots in cells) and mobile (drawers).
async function loadDatesAndSlots() {
  showLoading('Loading dates…');
  try {
    const res = await fetch(`${API_BASE}/dates`);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    const calendar = Array.isArray(data.calendar) ? data.calendar : [];
    availableDates = calendar.map((c) => c.date).sort();
    availableDateSet = new Set(availableDates);
    for (const { date, slots } of calendar) slotsByDate[date] = slots || [];

    if (availableDates.length === 0) {
      renderEmpty();
      return;
    }

    // Start the calendar on the month of the first available date.
    const first = new Date(availableDates[0] + 'T12:00:00Z');
    calendarYear  = first.getUTCFullYear();
    calendarMonth = first.getUTCMonth();
    renderCalendar();
    renderDateList();
  } catch (err) {
    showError(dateError, 'Could not load workshop dates. Please refresh the page.');
    renderEmpty();
  } finally {
    hideLoading();
  }
}

function renderEmpty() {
  calendarGrid.innerHTML = '';
  calMonthLabel.textContent = '—';
  calPrev.disabled = true;
  calNext.disabled = true;
  dateList.innerHTML = '<li class="date-list-empty">No upcoming workshops.</li>';
}

function renderCalendar() {
  const year = calendarYear;
  const month = calendarMonth;
  calMonthLabel.textContent = new Date(Date.UTC(year, month, 1))
    .toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });

  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrev  = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const todayIso = (() => {
    const t = new Date();
    return dateToIso(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    let cellYear = year, cellMonth = month, cellDay, outside = false;
    if (i < firstWeekday) {
      cellDay = daysInPrev - firstWeekday + i + 1;
      cellMonth = month - 1;
      if (cellMonth < 0) { cellMonth = 11; cellYear -= 1; }
      outside = true;
    } else if (i >= firstWeekday + daysInMonth) {
      cellDay = i - (firstWeekday + daysInMonth) + 1;
      cellMonth = month + 1;
      if (cellMonth > 11) { cellMonth = 0; cellYear += 1; }
      outside = true;
    } else {
      cellDay = i - firstWeekday + 1;
    }
    const iso = dateToIso(cellYear, cellMonth, cellDay);
    cells.push({
      iso, day: cellDay, outside,
      today: iso === todayIso,
      slots: outside ? [] : (slotsByDate[iso] || []),
    });
  }
  // Trim trailing all-outside row (5-week months don't get a 6th row of next-month numbers).
  while (cells.length > 35 && cells.slice(-7).every((c) => c.outside)) cells.length -= 7;

  calendarGrid.innerHTML = '';
  for (const c of cells) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    if (c.outside)         cell.classList.add('outside');
    if (c.today)           cell.classList.add('today');
    if (c.slots.length > 0) cell.classList.add('has-slots');

    const num = document.createElement('span');
    num.className = 'cal-day-number';
    num.textContent = String(c.day);
    cell.appendChild(num);

    if (c.slots.length > 0) {
      const slotsBox = document.createElement('div');
      slotsBox.className = 'cal-day-slots';
      for (const slot of c.slots) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-slot';
        btn.textContent = slot.start;
        btn.addEventListener('click', () => onSlotPicked(c.iso, slot));
        slotsBox.appendChild(btn);
      }
      cell.appendChild(slotsBox);
    }
    calendarGrid.appendChild(cell);
  }

  // Disable nav arrows when there's nothing of interest in that direction.
  const earliest = availableDates[0];
  const latest   = availableDates[availableDates.length - 1];
  const monthStart = `${year}-${pad2(month + 1)}`;
  calPrev.disabled = !earliest || earliest >= monthStart;
  calNext.disabled = !latest   || latest   <  `${year}-${pad2(month + 2)}`;
}

function renderDateList() {
  dateList.innerHTML = '';
  for (const iso of availableDates) {
    const li = document.createElement('li');

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'date-list-item';
    head.dataset.iso = iso;
    head.innerHTML =
      `<span class="weekday">${formatWeekday(iso)}</span>` +
      `<span class="date">${formatDateShort(iso)}</span>` +
      `<span class="chevron" aria-hidden="true">▾</span>`;
    head.setAttribute('aria-expanded', 'false');

    const drawer = document.createElement('div');
    drawer.className = 'date-drawer';
    // Drawer is populated lazily on first open.

    head.addEventListener('click', () => toggleDrawer(head, drawer, iso));

    li.appendChild(head);
    li.appendChild(drawer);
    dateList.appendChild(li);
  }
}

function renderDrawerSlots(drawer, iso) {
  drawer.innerHTML = '';
  const slots = slotsByDate[iso] || [];
  if (slots.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-slots-msg';
    msg.textContent = 'No slots available for this date.';
    drawer.appendChild(msg);
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'slots-grid';
  for (const slot of slots) {
    const sb = document.createElement('button');
    sb.type = 'button';
    sb.className = 'slot-btn';
    sb.textContent = formatSlotRange(slot);
    sb.addEventListener('click', () => onSlotPicked(iso, slot));
    grid.appendChild(sb);
  }
  drawer.appendChild(grid);
}

function toggleDrawer(head, drawer, iso) {
  const isOpen = drawer.classList.contains('open');
  // Close any other open drawer first.
  dateList.querySelectorAll('.date-drawer.open').forEach((d) => d.classList.remove('open'));
  dateList.querySelectorAll('.date-list-item.expanded').forEach((b) => {
    b.classList.remove('expanded');
    b.setAttribute('aria-expanded', 'false');
  });
  if (isOpen) return;  // user just closed this one — leave it closed

  renderDrawerSlots(drawer, iso);
  drawer.classList.add('open');
  head.classList.add('expanded');
  head.setAttribute('aria-expanded', 'true');
}

calPrev.addEventListener('click', () => {
  calendarMonth -= 1;
  if (calendarMonth < 0) { calendarMonth = 11; calendarYear -= 1; }
  renderCalendar();
});
calNext.addEventListener('click', () => {
  calendarMonth += 1;
  if (calendarMonth > 11) { calendarMonth = 0; calendarYear += 1; }
  renderCalendar();
});

// ── Slot picked: store + open the form ───────────────────────────────────
function onSlotPicked(iso, slot) {
  selectedDate  = iso;
  selectedStart = slot.start;
  selectedEnd   = slot.end;
  const dateLong = formatDateLong(iso);
  const slotRange = formatSlotRange(slot);
  summaryDate.textContent = dateLong;
  summarySlot.textContent = slotRange;
  // Mobile shows the title in the page header (next to the logo).
  headerTitle.textContent = `${dateLong} · ${slotRange}`;
  showStep(stepForm);
  updateBookBtnEnabled();
  document.getElementById('studentName').focus();
}

// ── Form: lesson type → persons reveal + live price + live validation ────
const nameInp       = document.getElementById('studentName');
const emailInp      = document.getElementById('studentEmail');
const lessonTypeSel = document.getElementById('lessonType');
const personsGroup  = document.getElementById('personsGroup');
const numPersonsInp = document.getElementById('numPersons');
const bookPriceEl   = document.getElementById('bookPrice');
const phoneInp      = document.getElementById('studentPhone');
const commentInp    = document.getElementById('comment');

async function loadLessonTypes() {
  try {
    const r = await fetch(`${API_BASE}/lesson-types`);
    if (!r.ok) return;
    const d = await r.json();
    lessonTypes = (d.lessonTypes || []).filter((t) => t && t.id && t.pricePerPersonCents > 0);
  } catch {
    lessonTypes = [];
  }
  populateLessonTypes();
  updateLessonUi();
}

function populateLessonTypes() {
  lessonTypeSel.innerHTML = '';
  if (lessonTypes.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No lesson types available';
    lessonTypeSel.appendChild(opt);
    lessonTypeSel.disabled = true;
    return;
  }
  lessonTypeSel.disabled = false;
  for (const t of lessonTypes) {
    const opt = document.createElement('option');
    opt.value = t.id;
    const price = formatEuro(t.pricePerPersonCents);
    opt.textContent = t.maxPersons > t.minPersons
      ? `${t.label} — ${price} / person`
      : `${t.label} — ${price}`;
    lessonTypeSel.appendChild(opt);
  }
}

function selectedLessonType() {
  return lessonTypes.find((t) => t.id === lessonTypeSel.value) || null;
}

function clampPersons(n, type) {
  const min = type ? type.minPersons : 1;
  const max = type ? type.maxPersons : 1;
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function priceCents() {
  const t = selectedLessonType();
  if (!t) return 0;
  return t.pricePerPersonCents * clampPersons(parseInt(numPersonsInp.value, 10), t);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isFormValid() {
  const n = nameInp.value.trim();
  const e = emailInp.value.trim();
  if (n.length < 2 || n.length > 99) return false;
  if (!EMAIL_RE.test(e))             return false;
  if (commentInp.value.length > 500) return false;
  const t = selectedLessonType();
  if (!t)                            return false;
  const p = clampPersons(parseInt(numPersonsInp.value, 10), t);
  if (p < t.minPersons || p > t.maxPersons) return false;
  return true;
}
function updateBookBtnEnabled() {
  bookBtn.disabled = !isFormValid();
}

function updateLessonUi() {
  const t = selectedLessonType();
  if (t && t.maxPersons > t.minPersons) {
    personsGroup.classList.remove('hidden');
    numPersonsInp.min = String(t.minPersons);
    numPersonsInp.max = String(t.maxPersons);
    const current = parseInt(numPersonsInp.value, 10);
    numPersonsInp.value = String(clampPersons(current, t));
  } else {
    personsGroup.classList.add('hidden');
  }
  bookPriceEl.textContent = formatEuro(priceCents());
  updateBookBtnEnabled();
}

lessonTypeSel.addEventListener('change', updateLessonUi);
numPersonsInp.addEventListener('input', () => {
  const t = selectedLessonType();
  if (!t) return;
  const clamped = clampPersons(parseInt(numPersonsInp.value, 10), t);
  if (String(clamped) !== numPersonsInp.value) numPersonsInp.value = String(clamped);
  bookPriceEl.textContent = formatEuro(priceCents());
  updateBookBtnEnabled();
});

[nameInp, emailInp, commentInp].forEach((el) => {
  el.addEventListener('input', updateBookBtnEnabled);
});

function formatEuro(cents) { return `€${(cents / 100).toFixed(2)}`; }

// ── Step 2: submit ────────────────────────────────────────────────────────
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(formError);

  const studentName  = document.getElementById('studentName').value.trim();
  const studentEmail = document.getElementById('studentEmail').value.trim();
  const studentPhone = phoneInp.value.trim();
  const comment      = commentInp.value.trim();
  const lessonType   = lessonTypeSel.value;
  const lessonTypeObj = selectedLessonType();
  const numPersons   = clampPersons(parseInt(numPersonsInp.value, 10), lessonTypeObj);

  if (studentName.length < 2 || studentName.length > 99) {
    showError(formError, 'Please enter your full name (2 to 99 characters).');
    document.getElementById('studentName').focus();
    return;
  }
  // Practical email regex — local@host.tld, allowing the common chars.
  // Not RFC-perfect but good enough for the obvious-typo cases.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
    showError(formError, 'Please enter a valid email address.');
    document.getElementById('studentEmail').focus();
    return;
  }
  if (comment.length > 500) {
    showError(formError, 'Comment must be 500 characters or fewer.');
    commentInp.focus();
    return;
  }
  if (!selectedDate || !selectedStart) {
    showError(formError, 'Missing date or time slot. Please go back and select again.');
    return;
  }

  bookBtn.disabled = true;
  showLoading('Creating your booking…');

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: selectedDate,
        start: selectedStart,
        studentName,
        studentEmail,
        studentPhone: studentPhone || undefined,
        lessonType,
        numPersons,
        comment: comment || undefined,
        // amountCents is computed server-side from lessonType + numPersons.
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    if (!data.approveUrl) throw new Error('No payment URL returned. Please try again.');
    window.location.href = data.approveUrl;
  } catch (err) {
    hideLoading();
    bookBtn.disabled = false;
    showError(formError, err.message || 'Failed to create booking. Please try again.');
  }
});

// ── Per-step nav: back / cancel / close ────────────────────────────────────
function backFromStep(step) {
  if (step === stepForm) {
    headerTitle.textContent = '';
    showStep(stepDate);
  }
  // step 1 has no Back button; this branch can't be reached for stepDate.
}

function exitToPrevious() {
  if (document.referrer) window.history.back();
  else                    window.location.href = STUDIO_URL;
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const step = btn.closest('.step');
  if (!step) return;
  const action = btn.dataset.action;
  if (action === 'back') backFromStep(step);
  else if (action === 'cancel' || action === 'close') exitToPrevious();
});

// ── Boot ──────────────────────────────────────────────────────────────────
// Both fetches in parallel — neither depends on the other.
Promise.all([loadDatesAndSlots(), loadLessonTypes()]);
