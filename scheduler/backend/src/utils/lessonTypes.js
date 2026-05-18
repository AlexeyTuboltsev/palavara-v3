'use strict';

/**
 * Lesson-type read helpers used by booking handlers.
 *
 * The catalog lives in `palavara-lesson-types` (one row per type, PK
 * `LESSONTYPE#<id>`). Fields:
 *   - id
 *   - label
 *   - priceCents       — the total price for this lesson type. Charged as-is;
 *                        there is no per-person multiplication anywhere.
 *   - numPersons       — informational headcount. Snapshotted onto the
 *                        booking row for the studio's bookkeeping; the
 *                        booking flow does NOT enforce it against the
 *                        request and does NOT use it for pricing.
 *   - sessionCount     — 1 (single session) or 4 (4-session cycle)
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
 * Validate a lesson type id against the catalog and return its trusted
 * price + person count. The booking flow doesn't accept a customer-supplied
 * person count or price — both come from the catalog row.
 *
 * @returns {Promise<
 *   | { ok: true, type: object, numPersons: number, amountCents: number }
 *   | { ok: false, error: string }
 * >}
 */
async function resolveLessonTypeAndPrice({ lessonTypeId }) {
  if (!lessonTypeId) return { ok: false, error: 'Missing required field: lessonType' };

  const type = await getLessonType(lessonTypeId);
  if (!type) return { ok: false, error: `Unknown lesson type: ${lessonTypeId}` };
  if (type.active === false) return { ok: false, error: `Lesson type "${lessonTypeId}" is no longer offered` };

  const priceCents = type.priceCents;
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return { ok: false, error: `Lesson type "${lessonTypeId}" has no valid price configured` };
  }

  const numPersons = Number.isFinite(type.numPersons) && type.numPersons > 0
    ? type.numPersons
    : 1;

  return {
    ok: true,
    type,
    numPersons,
    amountCents: priceCents,
  };
}

module.exports = {
  getLessonType,
  resolveLessonTypeAndPrice,
};
