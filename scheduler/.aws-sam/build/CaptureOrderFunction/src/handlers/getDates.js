'use strict';

/**
 * GET /dates
 *
 * Returns the calendar of upcoming workshops in one call:
 *
 *   {
 *     "dates": ["YYYY-MM-DD", ...],         // legacy: list of bookable days
 *     "calendar": [
 *       { "date": "YYYY-MM-DD",
 *         "slots": [ { "start": "HH:MM", "end": "HH:MM" }, ... ] },
 *       ...
 *     ]
 *   }
 *
 * Slots already booked (status pending or confirmed) are filtered out.
 * Dates whose every slot is booked are dropped from both arrays.
 *
 * The booking page renders the whole month at a glance, so doing this
 * in one round-trip beats N parallel /availability calls.
 */

const { ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, serverError } = require('../utils/response');

const SLOTS_TABLE    = process.env.SLOTS_TABLE;
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}

exports.handler = async () => {
  try {
    const today = todayUtcIso();

    // 1. All active future slots (one paginated scan of the slots table).
    const slotItems = [];
    let key;
    do {
      const r = await ddb.send(new ScanCommand({
        TableName: SLOTS_TABLE,
        FilterExpression: '#s = :active AND #d >= :today',
        ExpressionAttributeNames: { '#s': 'status', '#d': 'date', '#st': 'start', '#e': 'end' },
        ExpressionAttributeValues: { ':active': 'active', ':today': today },
        ProjectionExpression: '#d, #st, #e',
        ExclusiveStartKey: key,
      }));
      slotItems.push(...(r.Items || []));
      key = r.LastEvaluatedKey;
    } while (key);

    // Group slot definitions by date.
    const slotsByDate = new Map();
    for (const s of slotItems) {
      if (!slotsByDate.has(s.date)) slotsByDate.set(s.date, []);
      slotsByDate.get(s.date).push({ start: s.start, end: s.end });
    }

    if (slotsByDate.size === 0) {
      return ok({ dates: [], calendar: [] });
    }

    // 2. Booked timeSlots per date — query the bookings GSI in parallel.
    const dates = [...slotsByDate.keys()];
    const bookedSets = await Promise.all(dates.map(async (date) => {
      const r = await ddb.send(new QueryCommand({
        TableName: BOOKINGS_TABLE,
        IndexName: 'date-index',
        KeyConditionExpression: '#d = :date',
        FilterExpression: '#s IN (:pending, :confirmed)',
        ExpressionAttributeNames: { '#d': 'date', '#s': 'status' },
        ExpressionAttributeValues: {
          ':date': date,
          ':pending': 'pending',
          ':confirmed': 'confirmed',
        },
        ProjectionExpression: 'timeSlot',
      }));
      return new Set((r.Items || []).map((it) => it.timeSlot));
    }));

    // 3. Subtract booked from active, keep only dates that still have slots.
    const calendar = [];
    for (let i = 0; i < dates.length; i++) {
      const date  = dates[i];
      const all   = slotsByDate.get(date).sort((a, b) => a.start.localeCompare(b.start));
      const taken = bookedSets[i];
      const free  = all.filter((s) => !taken.has(s.start));
      if (free.length > 0) calendar.push({ date, slots: free });
    }
    calendar.sort((a, b) => a.date.localeCompare(b.date));

    return ok({
      dates:    calendar.map((c) => c.date),  // legacy field, identical to before
      calendar,
    });
  } catch (err) {
    console.error('getDates error:', err);
    return serverError();
  }
};
