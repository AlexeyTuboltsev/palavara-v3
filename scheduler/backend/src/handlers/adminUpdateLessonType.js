'use strict';

/**
 * PUT /admin/lesson-types/{id}
 *
 * Body (JSON): partial — any subset of {label, priceCents, numPersons,
 * sessionCount, sortOrder, active}. The id is the URL path, not the
 * body, and is immutable (rename = create new, delete old).
 *
 * 404 if the row doesn't exist.
 */

const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');
const crypto = require('crypto');

const TABLE        = process.env.LESSON_TYPES_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

exports.handler = async (event) => {
  try {
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!ADMIN_SECRET || !supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    const id = event.pathParameters?.id;
    if (!id) return badRequest('Missing id in path');

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return badRequest('Invalid JSON body'); }

    const sets = [];
    const names  = { '#updatedAt': 'updatedAt' };
    const values = { ':now': new Date().toISOString() };

    if (body.label != null) {
      if (typeof body.label !== 'string' || body.label.trim().length < 1 || body.label.length > 100) {
        return badRequest('label must be 1-100 chars');
      }
      sets.push('#label = :label');
      names['#label']   = 'label';
      values[':label']  = body.label.trim();
    }
    if (body.priceCents != null) {
      const n = Number(body.priceCents);
      if (!Number.isInteger(n) || n <= 0) {
        return badRequest('priceCents must be a positive integer (cents)');
      }
      sets.push('priceCents = :priceCents');
      values[':priceCents'] = n;
    }
    if (body.numPersons != null) {
      const n = Number(body.numPersons);
      if (!Number.isInteger(n) || n < 1) return badRequest('numPersons must be a positive integer');
      sets.push('numPersons = :numPersons');
      values[':numPersons'] = n;
    }
    if (body.sortOrder != null) {
      const n = Number(body.sortOrder);
      if (!Number.isInteger(n)) return badRequest('sortOrder must be an integer');
      sets.push('sortOrder = :sortOrder');
      values[':sortOrder'] = n;
    }
    if (body.sessionCount != null) {
      const n = Number(body.sessionCount);
      if (n !== 1 && n !== 4) {
        return badRequest('sessionCount must be 1 (single) or 4 (4-session cycle)');
      }
      sets.push('sessionCount = :sessionCount');
      values[':sessionCount'] = n;
    }
    if (body.active != null) {
      sets.push('#active = :active');
      names['#active']  = 'active';
      values[':active'] = Boolean(body.active);
    }

    if (sets.length === 0) {
      return badRequest('Nothing to update — body must contain at least one field');
    }

    sets.push('#updatedAt = :now');

    try {
      const result = await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `LESSONTYPE#${id}` },
        UpdateExpression: 'SET ' + sets.join(', '),
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }));
      return ok(strip(result.Attributes));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return notFound(`Lesson type "${id}" not found`);
      }
      throw err;
    }
  } catch (err) {
    console.error('adminUpdateLessonType error:', err);
    return serverError();
  }
};

function strip(item) {
  return {
    id:           item.id,
    label:        item.label,
    priceCents:   item.priceCents,
    numPersons:   item.numPersons,
    sessionCount: item.sessionCount,
    active:       item.active,
    sortOrder:    item.sortOrder,
    createdAt:    item.createdAt,
    updatedAt:    item.updatedAt,
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
