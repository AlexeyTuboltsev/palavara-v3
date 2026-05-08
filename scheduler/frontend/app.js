/**
 * Palavara Scheduler — main booking page script (app.js)
 *
 * Desktop:
 *   1. Calendar with slots rendered inside each day cell.
 *   2. Click a slot → form (step 2).
 *
 * Mobile (≤ 600 px):
 *   1. Vertical list of dates that have workshops.
 *   2. Tap a date → drawer expands inline with that date's slots.
 *   3. Tap a slot → form (step 2).
 *
 * All visible strings come from i18next (locales/<lng>/translation.json).
 * The page is wired so this file is loaded BEFORE i18next.init() resolves —
 * we expose `boot()` which i18n.js calls once translations are ready.
 */

'use strict';

// ── Config ─────────────────────────────────────────────────────────────────
const API_BASE = window.SCHEDULER_CONFIG?.API_BASE_URL || '';
const STUDIO_URL = 'https://studio.palavara.com/';

const t = (...args) => window.i18next ? window.i18next.t(...args) : args[0];

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
const bookBtnLabel = document.getElementById('bookBtnLabel');
const dateError   = document.getElementById('dateError');
const formError   = document.getElementById('formError');
const headerTitle = document.getElementById('headerTitle');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMsg  = document.getElementById('loadingMsg');

const STEPS = [stepDate, stepForm];

// ── State ──────────────────────────────────────────────────────────────────
let availableDates = [];
let availableDateSet = new Set();
let slotsByDate = {};
let lessonTypes = [];
let calendarYear  = 0;
let calendarMonth = 0;
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

function showLoading(msg) {
  loadingMsg.textContent = msg || t('common.loading');
  loadingOverlay.classList.remove('hidden');
}
function hideLoading() { loadingOverlay.classList.add('hidden'); }

function showError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
function hideError(el)      { el.classList.add('hidden'); el.textContent = ''; }

function uiLocale() {
  return (window.i18next && window.i18next.resolvedLanguage) || 'en';
}

function formatDateLong(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString(uiLocale(), {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
function formatWeekday(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString(uiLocale(), { weekday: 'long' });
}
function formatDateShort(isoDate) {
  return new Date(isoDate + 'T12:00:00Z').toLocaleDateString(uiLocale(), {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
function formatSlotRange(slot) { return `${slot.start} – ${slot.end}`; }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function dateToIso(year, month, day) { return `${year}-${pad2(month + 1)}-${pad2(day)}`; }
function formatEuro(cents) { return `€${(cents / 100).toFixed(2)}`; }

function isDesktop() { return window.matchMedia('(min-width: 601px)').matches; }

// ── On load: fetch the whole calendar in one request ─────────────────────
async function loadDatesAndSlots() {
  showLoading();
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

    const first = new Date(availableDates[0] + 'T12:00:00Z');
    calendarYear  = first.getUTCFullYear();
    calendarMonth = first.getUTCMonth();
    renderCalendar();
    renderDateList();
  } catch (err) {
    showError(dateError, t('datePicker.errorLoading'));
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
  const li = document.createElement('li');
  li.className = 'date-list-empty';
  li.textContent = t('datePicker.noDates');
  dateList.innerHTML = '';
  dateList.appendChild(li);
}

function renderCalendar() {
  const year = calendarYear;
  const month = calendarMonth;
  calMonthLabel.textContent = new Date(Date.UTC(year, month, 1))
    .toLocaleDateString(uiLocale(), { year: 'numeric', month: 'long' });

  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrev  = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const todayIso = (() => {
    const d = new Date();
    return dateToIso(d.getFullYear(), d.getMonth(), d.getDate());
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

    const wkd = document.createElement('span');
    wkd.className = 'weekday';
    wkd.textContent = formatWeekday(iso);
    const dt = document.createElement('span');
    dt.className = 'date';
    dt.textContent = formatDateShort(iso);
    const ch = document.createElement('span');
    ch.className = 'chevron';
    ch.setAttribute('aria-hidden', 'true');
    ch.textContent = '▾';
    head.appendChild(wkd);
    head.appendChild(dt);
    head.appendChild(ch);
    head.setAttribute('aria-expanded', 'false');

    const drawer = document.createElement('div');
    drawer.className = 'date-drawer';

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
    msg.textContent = t('datePicker.noSlotsForDate');
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
  dateList.querySelectorAll('.date-drawer.open').forEach((d) => d.classList.remove('open'));
  dateList.querySelectorAll('.date-list-item.expanded').forEach((b) => {
    b.classList.remove('expanded');
    b.setAttribute('aria-expanded', 'false');
  });
  if (isOpen) return;

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
const phoneInp      = document.getElementById('studentPhone');
const commentInp    = document.getElementById('comment');

async function loadLessonTypes() {
  try {
    const r = await fetch(`${API_BASE}/lesson-types`);
    if (!r.ok) return;
    const d = await r.json();
    lessonTypes = (d.lessonTypes || []).filter((lt) => lt && lt.id && lt.pricePerPersonCents > 0);
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
    opt.textContent = t('form.lessonType.noTypes');
    lessonTypeSel.appendChild(opt);
    lessonTypeSel.disabled = true;
    return;
  }
  lessonTypeSel.disabled = false;
  for (const lt of lessonTypes) {
    const opt = document.createElement('option');
    opt.value = lt.id;
    const price = formatEuro(lt.pricePerPersonCents);
    opt.textContent = lt.maxPersons > lt.minPersons
      ? t('form.lessonType.optionPerPerson', { label: lt.label, price })
      : t('form.lessonType.optionFlat', { label: lt.label, price });
    lessonTypeSel.appendChild(opt);
  }
}

function selectedLessonType() {
  return lessonTypes.find((lt) => lt.id === lessonTypeSel.value) || null;
}

function clampPersons(n, type) {
  const min = type ? type.minPersons : 1;
  const max = type ? type.maxPersons : 1;
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function priceCents() {
  const lt = selectedLessonType();
  if (!lt) return 0;
  return lt.pricePerPersonCents * clampPersons(parseInt(numPersonsInp.value, 10), lt);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isFormValid() {
  const n = nameInp.value.trim();
  const e = emailInp.value.trim();
  if (n.length < 2 || n.length > 99) return false;
  if (!EMAIL_RE.test(e))             return false;
  if (commentInp.value.length > 500) return false;
  const lt = selectedLessonType();
  if (!lt)                           return false;
  const p = clampPersons(parseInt(numPersonsInp.value, 10), lt);
  if (p < lt.minPersons || p > lt.maxPersons) return false;
  return true;
}
function updateBookBtnEnabled() {
  bookBtn.disabled = !isFormValid();
}

function refreshSubmitLabel() {
  bookBtnLabel.textContent = t('form.submitWithPrice', { price: formatEuro(priceCents()) });
}

function updateLessonUi() {
  const lt = selectedLessonType();
  if (lt && lt.maxPersons > lt.minPersons) {
    personsGroup.classList.remove('hidden');
    numPersonsInp.min = String(lt.minPersons);
    numPersonsInp.max = String(lt.maxPersons);
    const current = parseInt(numPersonsInp.value, 10);
    numPersonsInp.value = String(clampPersons(current, lt));
  } else {
    personsGroup.classList.add('hidden');
  }
  refreshSubmitLabel();
  updateBookBtnEnabled();
}

lessonTypeSel.addEventListener('change', updateLessonUi);
numPersonsInp.addEventListener('input', () => {
  const lt = selectedLessonType();
  if (!lt) return;
  const clamped = clampPersons(parseInt(numPersonsInp.value, 10), lt);
  if (String(clamped) !== numPersonsInp.value) numPersonsInp.value = String(clamped);
  refreshSubmitLabel();
  updateBookBtnEnabled();
});

[nameInp, emailInp, commentInp].forEach((el) => {
  el.addEventListener('input', updateBookBtnEnabled);
});

// ── Step 2: submit ────────────────────────────────────────────────────────
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(formError);

  const studentName  = nameInp.value.trim();
  const studentEmail = emailInp.value.trim();
  const studentPhone = phoneInp.value.trim();
  const comment      = commentInp.value.trim();
  const lessonType   = lessonTypeSel.value;
  const lessonTypeObj = selectedLessonType();
  const numPersons   = clampPersons(parseInt(numPersonsInp.value, 10), lessonTypeObj);

  if (studentName.length < 2 || studentName.length > 99) {
    showError(formError, t('form.errors.nameLength'));
    nameInp.focus();
    return;
  }
  if (!EMAIL_RE.test(studentEmail)) {
    showError(formError, t('form.errors.emailFormat'));
    emailInp.focus();
    return;
  }
  if (comment.length > 500) {
    showError(formError, t('form.errors.commentLength'));
    commentInp.focus();
    return;
  }
  if (!selectedDate || !selectedStart) {
    showError(formError, t('form.errors.missingSlot'));
    return;
  }

  bookBtn.disabled = true;
  showLoading(t('form.submitting'));

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
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
    if (!data.approveUrl) throw new Error(t('form.errors.noPaymentUrl'));
    window.location.href = data.approveUrl;
  } catch (err) {
    hideLoading();
    bookBtn.disabled = false;
    showError(formError, err.message || t('form.errors.generic'));
  }
});

// ── Per-step nav: back / cancel / close ────────────────────────────────────
function backFromStep(step) {
  if (step === stepForm) {
    headerTitle.textContent = '';
    showStep(stepDate);
  }
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
// Called by i18n.js once translations are ready, so the first render of
// the dropdown / submit label / error messages already shows localized
// strings instead of the static English source.
window.boot = function boot() {
  refreshSubmitLabel();
  Promise.all([loadDatesAndSlots(), loadLessonTypes()]);
};
