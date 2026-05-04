'use strict';

/**
 * All available time slots in a day: 10:00 – 22:00 (inclusive start, exclusive end).
 * Returns strings like "10:00", "11:00", … "21:00"  (12 slots total).
 */
const ALL_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 10 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

/**
 * Validate YYYY-MM-DD format and that the date is not in the past.
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidFutureDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return d >= today;
}

module.exports = { ALL_SLOTS, isValidFutureDate };
