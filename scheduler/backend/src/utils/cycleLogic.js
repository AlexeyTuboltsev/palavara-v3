'use strict';

/**
 * 4-session cycle helpers — shared between createBooking, paypalWebhook,
 * captureOrder and cancelBooking.
 *
 * A "cycle" is N (currently always 4) booking rows in the bookings table
 * that share a `cycleId`. They are atomically created, confirmed, and
 * cancelled together. Each row still occupies one slot on the calendar
 * (so existing capacity logic in createBooking / getDates needs no
 * change) and carries its own `date` + `timeSlot`, plus:
 *
 *   - cycleId       (uuid, identical across the N rows)
 *   - sessionIndex  (1..N, ordered chronologically by date+timeSlot)
 *   - paypalOrderId (identical across the N rows)
 *   - amountCents   (bundle total, identical across the N rows)
 *
 * Per the spec:
 *   - Sessions 1..N-1 must each be on a DIFFERENT calendar date.
 *   - Session N (the final one) must be at least 7 calendar days after
 *     the previous session.
 *
 * Phase-4 scope: backend creates / confirms / cancels cycles atomically
 * via DynamoDB TransactWriteItems. Email + calendar side-effects are
 * temporarily suppressed for cycle bookings — Phase 5 will ship a
 * cycle-aware summary email and a multi-event ICS.
 */

const { ScanCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('./dynamo');

const TABLE = process.env.BOOKINGS_TABLE;

/** Sessions 1..N-1 spacing rule: each session on a different calendar date. */
function differentDates(slots) {
  const seen = new Set();
  for (let i = 0; i < slots.length - 1; i++) {
    if (seen.has(slots[i].date)) return false;
    seen.add(slots[i].date);
  }
  return true;
}

/** Final-session rule: ≥ 7 calendar days after the previous session's date. */
function finalSessionFarEnough(slots) {
  if (slots.length < 2) return true;
  const prev = Date.parse(slots[slots.length - 2].date + 'T00:00:00Z');
  const last = Date.parse(slots[slots.length - 1].date + 'T00:00:00Z');
  if (isNaN(prev) || isNaN(last)) return false;
  const diffDays = (last - prev) / (24 * 3600 * 1000);
  return diffDays >= 7;
}

/**
 * Validate the client-supplied slot list for a cycle. Returns the slots
 * sorted chronologically and stamped with their session index, or an
 * error message suitable for badRequest().
 *
 * @param {Array<{date:string,start:string}>} rawSlots
 * @param {number} expectedCount  Comes from the lesson type's sessionCount.
 */
function validateCycleSlots(rawSlots, expectedCount) {
  if (!Array.isArray(rawSlots)) {
    return { ok: false, error: 'slots must be an array' };
  }
  if (rawSlots.length !== expectedCount) {
    return {
      ok: false,
      error: `Expected ${expectedCount} slots for this lesson type, got ${rawSlots.length}`,
    };
  }

  const slots = rawSlots.map((s) => {
    if (!s || typeof s.date !== 'string' || typeof s.start !== 'string') return null;
    return { date: s.date, start: s.start };
  });
  if (slots.some((s) => s == null)) {
    return { ok: false, error: 'Each slot must be {date, start}' };
  }

  // Reject duplicate (date,start) pairs early — even before spacing rules.
  const seen = new Set();
  for (const s of slots) {
    const key = s.date + 'T' + s.start;
    if (seen.has(key)) return { ok: false, error: 'Duplicate slot in cycle' };
    seen.add(key);
  }

  slots.sort((a, b) => (a.date + 'T' + a.start).localeCompare(b.date + 'T' + b.start));

  if (!differentDates(slots)) {
    return { ok: false, error: 'Sessions 1–' + (expectedCount - 1) + ' must each be on a different day' };
  }
  if (!finalSessionFarEnough(slots)) {
    return { ok: false, error: 'Session ' + expectedCount + ' must be at least 7 days after the previous session' };
  }

  return {
    ok:    true,
    slots: slots.map((s, i) => ({ ...s, sessionIndex: i + 1 })),
  };
}

/**
 * Load every booking row sharing this cycleId (typically N=4). Used by the
 * webhook / capture / cancel handlers to propagate state across the cycle.
 *
 * Bookings table is small (single-studio MVP), so a filtered Scan is fine.
 * If it ever grows, add a GSI on cycleId.
 */
async function findCycleSiblings(cycleId) {
  if (!cycleId) return [];
  const items = [];
  let key;
  do {
    const r = await ddb.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'cycleId = :c',
      ExpressionAttributeValues: { ':c': cycleId },
      ExclusiveStartKey: key,
    }));
    items.push(...(r.Items || []));
    key = r.LastEvaluatedKey;
  } while (key);

  items.sort((a, b) => (a.sessionIndex ?? 0) - (b.sessionIndex ?? 0));
  return items;
}

/**
 * TransactWriteItems update across every row of a cycle. Each row's
 * UpdateExpression is identical and conditional on the same "from" status,
 * so the whole flip is atomic — partial state can't happen.
 *
 * @param {Array<object>} rows         Cycle siblings (from findCycleSiblings).
 * @param {object} args
 * @param {string} args.updateExpression
 * @param {string} args.conditionExpression
 * @param {object} args.expressionAttributeNames
 * @param {object} args.expressionAttributeValues
 */
async function transactUpdateAll(rows, {
  updateExpression,
  conditionExpression,
  expressionAttributeNames,
  expressionAttributeValues,
}) {
  if (rows.length === 0) return;
  const TransactItems = rows.map((row) => ({
    Update: {
      TableName: TABLE,
      Key: { PK: row.PK },
      UpdateExpression: updateExpression,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    },
  }));
  await ddb.send(new TransactWriteCommand({ TransactItems }));
}

module.exports = {
  validateCycleSlots,
  findCycleSiblings,
  transactUpdateAll,
};
