'use strict';

/**
 * DELETE /admin/lesson-types/{id}
 *
 * Hard-delete. Existing bookings keep their snapshotted lessonTypeLabel
 * + amountCents, so removing a row doesn't corrupt history. If the type
 * might be needed again, prefer PUT with `active: false` so it stays
 * editable from the admin UI without polluting the public dropdown.
 */

const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
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

    try {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: `LESSONTYPE#${id}` },
        ConditionExpression: 'attribute_exists(PK)',
      }));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return notFound(`Lesson type "${id}" not found`);
      }
      throw err;
    }

    return ok({ id, deleted: true });
  } catch (err) {
    console.error('adminDeleteLessonType error:', err);
    return serverError();
  }
};

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
