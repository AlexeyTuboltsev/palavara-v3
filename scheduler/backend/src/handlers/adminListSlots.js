'use strict';

/**
 * GET /admin/slots?from=&to=&includeCancelled=
 *
 * Returns all configured slots in a date range. Used by the admin
 * calendar view (booking conflicts come from /admin/bookings overlay).
 *
 * Query parameters (all optional):
 *   from              YYYY-MM-DD (default: today)
 *   to                YYYY-MM-DD (default: open-ended)
 *   includeCancelled  "true"/"false" (default: false)
 */

const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest } = require('../utils/response');
const { isValidDateString } = require('../utils/slots');
const crypto = require('crypto');

const TABLE        = process.env.SLOTS_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

exports.handler = async (event) => {
  try {
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!ADMIN_SECRET || !supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    const q = event.queryStringParameters || {};
    const today = new Date().toISOString().slice(0, 10);
    const from = q.from || today;
    const to   = q.to;
    if (!isValidDateString(from) || (to && !isValidDateString(to))) {
      return badRequest('from / to must be YYYY-MM-DD');
    }
    const includeCancelled = q.includeCancelled === 'true';

    const filters = ['#d >= :from'];
    const names   = { '#d': 'date' };
    const values  = { ':from': from };
    if (to) {
      filters.push('#d <= :to');
      values[':to'] = to;
    }
    if (!includeCancelled) {
      filters.push('#s = :active');
      names['#s']      = 'status';
      values[':active'] = 'active';
    }

    const items = [];
    let exclusiveStartKey;
    do {
      const result = await ddb.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: filters.join(' AND '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ExclusiveStartKey: exclusiveStartKey,
      }));
      items.push(...(result.Items || []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    items.sort((a, b) => {
      const byDate = (a.date || '').localeCompare(b.date || '');
      if (byDate !== 0) return byDate;
      return (a.start || '').localeCompare(b.start || '');
    });

    return ok({
      slots: items.map(strip),
      count: items.length,
    });
  } catch (err) {
    console.error('adminListSlots error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function strip(item) {
  return {
    slotId:      item.slotId,
    date:        item.date,
    start:       item.start,
    end:         item.end,
    status:      item.status,
    createdAt:   item.createdAt,
    cancelledAt: item.cancelledAt,
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
