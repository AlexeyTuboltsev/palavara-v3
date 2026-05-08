'use strict';

/**
 * GET /admin/lesson-types
 *
 * Returns every lesson-type row, including archived ones (active=false),
 * so the admin UI can edit / unarchive. The public GET /lesson-types
 * filters to active only.
 */

const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, serverError } = require('../utils/response');
const crypto = require('crypto');

const TABLE        = process.env.LESSON_TYPES_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

exports.handler = async (event) => {
  try {
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!ADMIN_SECRET || !supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    const items = [];
    let key;
    do {
      const r = await ddb.send(new ScanCommand({
        TableName: TABLE,
        ExclusiveStartKey: key,
      }));
      items.push(...(r.Items || []));
      key = r.LastEvaluatedKey;
    } while (key);

    items.sort((a, b) => {
      const byOrder = (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      if (byOrder !== 0) return byOrder;
      return (a.label || '').localeCompare(b.label || '');
    });

    return ok({
      lessonTypes: items.map(strip),
      count: items.length,
    });
  } catch (err) {
    console.error('adminListLessonTypes error:', err);
    return serverError();
  }
};

function strip(item) {
  return {
    id:                  item.id,
    label:               item.label,
    pricePerPersonCents: item.pricePerPersonCents,
    minPersons:          item.minPersons,
    maxPersons:          item.maxPersons,
    active:              item.active,
    sortOrder:           item.sortOrder,
    createdAt:           item.createdAt,
    updatedAt:           item.updatedAt,
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
