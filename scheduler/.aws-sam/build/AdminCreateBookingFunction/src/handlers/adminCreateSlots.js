'use strict';

/**
 * POST /admin/slots
 *
 * Body:
 *   {
 *     "start":      "14:00",
 *     "end":        "16:00",
 *     "startDate":  "2026-05-07",
 *     "endDate":    "2026-07-31",       // required if recurrence != "none"
 *     "recurrence": "none" | "daily" | "weekly" | "monthly",
 *     "exclusions": ["2026-06-17", ...]  // optional
 *   }
 *
 * Expands the recurrence into individual slot rows and writes them in
 * batches. Existing rows on the same (date, start) pair are skipped
 * (no error) so re-running with overlapping ranges is safe.
 *
 * Response: { slots: [...newly created rows...], skipped: <number> }.
 */

const { BatchWriteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { isValidDateString, isValidTimeString, expandRecurrence } = require('../utils/slots');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const TABLE        = process.env.SLOTS_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const VALID_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];

exports.handler = async (event) => {
  try {
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!ADMIN_SECRET || !supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const { start, end, startDate, endDate, recurrence = 'none', exclusions = [] } = body;

    if (!isValidTimeString(start)) return badRequest('start must be HH:MM');
    if (!isValidTimeString(end)) return badRequest('end must be HH:MM');
    if (start >= end) return badRequest('start must be before end');
    if (!isValidDateString(startDate)) return badRequest('startDate must be YYYY-MM-DD');
    if (!VALID_RECURRENCES.includes(recurrence)) {
      return badRequest(`recurrence must be one of: ${VALID_RECURRENCES.join(', ')}`);
    }
    if (recurrence !== 'none' && !isValidDateString(endDate)) {
      return badRequest('endDate is required when recurrence is set');
    }
    if (!Array.isArray(exclusions) || exclusions.some((d) => !isValidDateString(d))) {
      return badRequest('exclusions must be an array of YYYY-MM-DD');
    }

    const dates = expandRecurrence({ startDate, endDate, recurrence, exclusions });
    if (dates.length === 0) {
      return badRequest('No dates produced — check startDate / endDate / exclusions');
    }
    if (dates.length > 1000) {
      return badRequest(`Too many slots in one request (${dates.length}); split into smaller ranges`);
    }

    // Identify which (date, start) pairs already have an active slot — skip those.
    const existingDates = await findExistingActiveSlots(dates, start);

    const now = new Date().toISOString();
    const toCreate = dates
      .filter((d) => !existingDates.has(d))
      .map((d) => ({
        PK:        `SLOT#${uuidv4()}`,
        slotId:    undefined,  // filled below from PK
        date:      d,
        start,
        end,
        status:    'active',
        createdAt: now,
      }))
      .map((row) => ({ ...row, slotId: row.PK.slice('SLOT#'.length) }));

    // BatchWrite is 25 items max per call.
    for (let i = 0; i < toCreate.length; i += 25) {
      const chunk = toCreate.slice(i, i + 25);
      await ddb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE]: chunk.map((Item) => ({ PutRequest: { Item } })),
        },
      }));
    }

    return ok({
      slots:   toCreate.map(strip),
      skipped: existingDates.size,
    });
  } catch (err) {
    console.error('adminCreateSlots error:', err);
    return serverError();
  }
};

/**
 * Return the set of dates from `dates` that already have an active slot
 * at the given start time. Issues one Query per date — fine for our
 * <=1000-slots-per-request cap.
 */
async function findExistingActiveSlots(dates, start) {
  const out = new Set();
  for (const d of dates) {
    const result = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date AND #st = :start',
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#d': 'date', '#st': 'start', '#s': 'status' },
      ExpressionAttributeValues: { ':date': d, ':start': start, ':active': 'active' },
      Limit: 1,
    }));
    if ((result.Items || []).length > 0) out.add(d);
  }
  return out;
}

function strip(item) {
  return {
    slotId:    item.slotId,
    date:      item.date,
    start:     item.start,
    end:       item.end,
    status:    item.status,
    createdAt: item.createdAt,
  };
}

function unauthorized() {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Unauthorized' }),
  };
}

function timingSafeEq(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
