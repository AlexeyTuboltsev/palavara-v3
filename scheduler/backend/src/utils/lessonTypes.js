'use strict';

/**
 * Lesson-type read helpers used by booking handlers.
 *
 * The catalog lives in `palavara-lesson-types` (one row per type, PK
 * `LESSONTYPE#<id>`). Fields:
 *   - id
 *   - label
 *   - pricePerPersonCents
 *   - minPersons / maxPersons
 *   - active
 *   - sortOrder
 *
 * Booking handlers read a single row by id at create time. The frontend
 * already filters to active types, but server-side validation must
 * re-check `active` to defend against a stale or hostile request.
 */

const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('./dynamo');

const TABLE = process.env.LESSON_TYPES_TABLE;

/**
 * Look up a lesson type by id. Returns the row or null. Inactive rows
 * are returned as-is — the caller decides whether to allow them
 * (`getBooking` should still echo the label of an archived type so old
 * bookings render; `createBooking` should reject inactive types).
 */
async function getLessonType(id) {
  if (typeof id !== 'string' || !id) return null;
  const r = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `LESSONTYPE#${id}` },
  }));
  return r.Item || null;
}

/**
 * Validate {lessonType, numPersons} against the catalog and compute the
 * authoritative price.
 *
 * @returns {Promise<
 *   | { ok: true, type: object, numPersons: number, amountCents: number }
 *   | { ok: false, error: string }
 * >}
 */
async function resolveLessonTypeAndPrice({ lessonTypeId, numPersons }) {
  if (!lessonTypeId) return { ok: false, error: 'Missing required field: lessonType' };

  const type = await getLessonType(lessonTypeId);
  if (!type) return { ok: false, error: `Unknown lesson type: ${lessonTypeId}` };
  if (type.active === false) return { ok: false, error: `Lesson type "${lessonTypeId}" is no longer offered` };

  const min = type.minPersons ?? 1;
  const max = type.maxPersons ?? 1;
  let n = parseInt(numPersons, 10);
  if (!Number.isFinite(n)) n = min;
  if (n < min || n > max) {
    return { ok: false, error: `numPersons must be between ${min} and ${max} for ${type.label}` };
  }

  const ppCents = type.pricePerPersonCents;
  if (!Number.isFinite(ppCents) || ppCents <= 0) {
    return { ok: false, error: `Lesson type "${lessonTypeId}" has no valid price configured` };
  }

  return {
    ok: true,
    type,
    numPersons: n,
    amountCents: ppCents * n,
  };
}

module.exports = {
  getLessonType,
  resolveLessonTypeAndPrice,
};
