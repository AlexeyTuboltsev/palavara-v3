'use strict';

/**
 * Slot data layer — DynamoDB-backed.
 *
 * Slots used to be a hardcoded map in this module. They've moved to the
 * `palavara-slots` table so the studio owner can manage them from the
 * admin UI. Each slot is a single row; recurrence is expanded at create
 * time (no seriesId).
 *
 * Schema:
 *   PK:          "SLOT#<slotId>"
 *   slotId:      uuid
 *   date:        "YYYY-MM-DD"
 *   start:       "HH:MM"
 *   end:         "HH:MM"
 *   status:      "active" | "cancelled"
 *   createdAt:   ISO timestamp
 *   cancelledAt: ISO timestamp (optional)
 *
 * GSI date-index: PK = date, SK = start. Used by getSlotsForDate, the
 * admin slot list, and the admin date-range query.
 *
 * Note on date validation: we accept any well-formed YYYY-MM-DD (no past-
 * date guard here). Past-date filtering happens in the handlers that
 * actually surface dates to users (getDates, listSlots).
 */

const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('./dynamo');

const TABLE = process.env.SLOTS_TABLE;


// ── Validation helpers ────────────────────────────────────────────────

function isValidDateString(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function isValidTimeString(timeStr) {
  return typeof timeStr === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}


// ── Reads ─────────────────────────────────────────────────────────────

/** All upcoming dates that have at least one active slot. */
async function getAvailableDates() {
  const today = todayUtcIso();

  const items = [];
  let exclusiveStartKey;
  do {
    const result = await ddb.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: '#s = :active AND #d >= :today',
      ExpressionAttributeNames: { '#s': 'status', '#d': 'date' },
      ExpressionAttributeValues: { ':active': 'active', ':today': today },
      ProjectionExpression: '#d',
      ExclusiveStartKey: exclusiveStartKey,
    }));
    items.push(...(result.Items || []));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  const set = new Set(items.map((i) => i.date));
  return Array.from(set).sort();
}

/** Active slots for a single date, sorted by start time. */
async function getSlotsForDate(dateStr) {
  if (!isValidDateString(dateStr)) return [];
  if (dateStr < todayUtcIso()) return [];

  const result = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'date-index',
    KeyConditionExpression: '#d = :date',
    FilterExpression: '#s = :active',
    ExpressionAttributeNames: { '#d': 'date', '#s': 'status' },
    ExpressionAttributeValues: { ':date': dateStr, ':active': 'active' },
  }));

  return (result.Items || [])
    .map((item) => ({ start: item.start, end: item.end }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Look up a single active slot by date + start. Returns null if not found. */
async function findSlot(dateStr, startTime) {
  if (!isValidDateString(dateStr) || !isValidTimeString(startTime)) return null;

  const result = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'date-index',
    KeyConditionExpression: '#d = :date AND #st = :start',
    FilterExpression: '#s = :active',
    ExpressionAttributeNames: { '#d': 'date', '#st': 'start', '#s': 'status' },
    ExpressionAttributeValues: { ':date': dateStr, ':start': startTime, ':active': 'active' },
    Limit: 1,
  }));

  const item = (result.Items || [])[0];
  if (!item) return null;
  return { start: item.start, end: item.end };
}

async function isValidSlot(dateStr, startTime) {
  return (await findSlot(dateStr, startTime)) !== null;
}


// ── Date arithmetic for recurrence ────────────────────────────────────

/**
 * Expand a recurrence into an array of YYYY-MM-DD dates.
 *
 * @param {object} args
 * @param {string} args.startDate   YYYY-MM-DD (inclusive)
 * @param {string} args.endDate     YYYY-MM-DD (inclusive); ignored when recurrence='none'
 * @param {'none'|'daily'|'weekly'|'monthly'} args.recurrence
 * @param {string[]=} args.exclusions   YYYY-MM-DD dates to skip
 * @returns {string[]}
 */
function expandRecurrence({ startDate, endDate, recurrence, exclusions = [] }) {
  if (!isValidDateString(startDate)) {
    throw new Error('startDate must be YYYY-MM-DD');
  }
  if (recurrence !== 'none' && !isValidDateString(endDate)) {
    throw new Error('endDate must be YYYY-MM-DD when recurrence is set');
  }
  if (recurrence === 'none') {
    return exclusions.includes(startDate) ? [] : [startDate];
  }
  if (endDate < startDate) {
    return [];
  }

  const skip = new Set(exclusions);
  const out  = [];
  let current = startDate;
  const safety = 5000; // upper bound to prevent runaway loops
  let n = 0;
  while (current <= endDate && n < safety) {
    if (!skip.has(current)) out.push(current);
    current = advance(current, recurrence);
    n += 1;
  }
  return out;
}

/** Advance a YYYY-MM-DD by one recurrence step. */
function advance(dateStr, recurrence) {
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  const utc = Date.UTC(y, m - 1, d);
  const dayMs = 24 * 60 * 60 * 1000;

  if (recurrence === 'daily') {
    return toIso(new Date(utc + dayMs));
  }
  if (recurrence === 'weekly') {
    return toIso(new Date(utc + 7 * dayMs));
  }
  if (recurrence === 'monthly') {
    // Jump month, keep day-of-month. If overflow (e.g. Jan 31 → Feb 31),
    // skip to the next month that has the same day.
    let yy = y;
    let mm = m + 1;
    while (true) {
      if (mm > 12) {
        mm = 1;
        yy += 1;
      }
      const lastDay = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
      if (d <= lastDay) {
        return `${yy}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
      mm += 1;
    }
  }
  throw new Error(`Unknown recurrence: ${recurrence}`);
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}


module.exports = {
  isValidDateString,
  isValidTimeString,
  getAvailableDates,
  getSlotsForDate,
  findSlot,
  isValidSlot,
  expandRecurrence,
};
