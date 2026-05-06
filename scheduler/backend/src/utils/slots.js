'use strict';

/**
 * Wheel-throwing workshop slot definitions.
 *
 * Each ISO date maps to an array of explicit 2-hour slots with start/end times
 * in Europe/Berlin local time. Edit this file and redeploy to add, change, or
 * remove slots. Slot starts are unique within a single date, so the start time
 * alone is enough to identify a slot.
 *
 * After the date passes, the entries can be left in place or removed; past
 * dates are filtered out by isAvailableDate() so they never appear in the
 * /dates or /availability responses.
 */
const SLOTS = {
  '2026-05-07': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-09': [
    { start: '15:00', end: '17:00' },
  ],
  '2026-05-11': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-12': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-13': [
    { start: '18:30', end: '20:30' },
  ],
  '2026-05-14': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-16': [
    { start: '15:00', end: '17:00' },
  ],
  '2026-05-18': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-19': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-20': [
    { start: '18:30', end: '20:30' },
  ],
  '2026-05-21': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-25': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-26': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-27': [
    { start: '18:30', end: '20:30' },
  ],
  '2026-05-28': [
    { start: '14:00', end: '16:00' },
    { start: '16:30', end: '18:30' },
    { start: '19:00', end: '21:00' },
  ],
  '2026-05-30': [
    { start: '15:00', end: '17:00' },
  ],
};

/** Today's date in YYYY-MM-DD (UTC). Used for filtering past dates. */
function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateString(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/** Return all dates that have at least one slot AND are not in the past. */
function getAvailableDates() {
  const today = todayUtcIso();
  return Object.keys(SLOTS)
    .filter((d) => d >= today)
    .sort();
}

/** Return the slot list for a date, or [] if the date has no slots / is past. */
function getSlotsForDate(dateStr) {
  if (!isValidDateString(dateStr)) return [];
  if (dateStr < todayUtcIso()) return [];
  return SLOTS[dateStr] || [];
}

/**
 * Return the matching slot object {start, end} for a given date+start, or
 * null if no such slot exists. Used by createBooking to look up the end
 * time for a chosen start.
 */
function findSlot(dateStr, startTime) {
  const slots = getSlotsForDate(dateStr);
  return slots.find((s) => s.start === startTime) || null;
}

/** True if the booking request points at a real slot for that date. */
function isValidSlot(dateStr, startTime) {
  return findSlot(dateStr, startTime) !== null;
}

module.exports = {
  SLOTS,
  getAvailableDates,
  getSlotsForDate,
  findSlot,
  isValidSlot,
  isValidDateString,
};
