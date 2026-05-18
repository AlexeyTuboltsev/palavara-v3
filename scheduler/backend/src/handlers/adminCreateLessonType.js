'use strict';

/**
 * POST /admin/lesson-types
 *
 * Body (JSON): {
 *   id,            // required, slug — used in the URL of /admin/lesson-types/{id}
 *   label,         // required, 1-100 chars
 *   priceCents,    // required, positive int — the total price charged
 *   numPersons,    // optional, default 1 (informational headcount only)
 *   sessionCount,  // optional, default 1 (1 = single session, 4 = 4-session cycle)
 *   sortOrder,     // optional, default 100 (so it sorts after the seed rows)
 *   active         // optional, default true
 * }
 *
 * Refuses to overwrite an existing id (use PUT /admin/lesson-types/{id} to update).
 */

const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const crypto = require('crypto');

const TABLE        = process.env.LESSON_TYPES_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

exports.handler = async (event) => {
  try {
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!ADMIN_SECRET || !supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return badRequest('Invalid JSON body'); }

    const validation = validate(body);
    if (validation.error) return badRequest(validation.error);

    const now = new Date().toISOString();
    const item = {
      PK:           `LESSONTYPE#${validation.id}`,
      id:           validation.id,
      label:        validation.label,
      priceCents:   validation.priceCents,
      numPersons:   validation.numPersons,
      sessionCount: validation.sessionCount,
      sortOrder:    validation.sortOrder,
      active:       validation.active,
      createdAt:    now,
      updatedAt:    now,
    };

    try {
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      }));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return badRequest(`Lesson type "${validation.id}" already exists. Use PUT to update it.`);
      }
      throw err;
    }

    return ok(strip(item));
  } catch (err) {
    console.error('adminCreateLessonType error:', err);
    return serverError();
  }
};

function validate(body) {
  if (typeof body.id !== 'string' || !ID_RE.test(body.id)) {
    return { error: 'id is required and must match /^[a-z0-9][a-z0-9-]{0,39}$/' };
  }
  if (typeof body.label !== 'string' || body.label.trim().length < 1 || body.label.length > 100) {
    return { error: 'label is required (1-100 chars)' };
  }
  const priceCents = Number(body.priceCents);
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return { error: 'priceCents must be a positive integer (cents)' };
  }
  const numPersons = body.numPersons == null ? 1 : Number(body.numPersons);
  if (!Number.isInteger(numPersons) || numPersons < 1) {
    return { error: 'numPersons must be a positive integer' };
  }
  const sortOrder = body.sortOrder == null ? 100 : Number(body.sortOrder);
  if (!Number.isInteger(sortOrder)) {
    return { error: 'sortOrder must be an integer' };
  }
  const sessionCount = body.sessionCount == null ? 1 : Number(body.sessionCount);
  if (sessionCount !== 1 && sessionCount !== 4) {
    return { error: 'sessionCount must be 1 (single session) or 4 (4-session cycle)' };
  }
  const active = body.active == null ? true : Boolean(body.active);

  return {
    id: body.id,
    label: body.label.trim(),
    priceCents,
    numPersons,
    sessionCount,
    sortOrder,
    active,
  };
}

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
