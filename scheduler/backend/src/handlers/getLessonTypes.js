'use strict';

/**
 * GET /lesson-types
 *
 * Returns the catalog of lesson types — the booking page renders its
 * picker cards from this list.
 *
 * Response shape:
 *   {
 *     "lessonTypes": [
 *       {
 *         "id": "single",
 *         "label": "Single lesson",
 *         "priceCents": 9500,
 *         "numPersons": 1,
 *         "sessionCount": 1
 *       },
 *       ...
 *     ]
 *   }
 *
 * The price the customer pays is `priceCents` flat — there is no per-person
 * multiplication. `numPersons` is informational (studio bookkeeping) and is
 * snapshotted onto the booking row at create time.
 *
 * Inactive rows (`active = false`) are filtered out so the owner can
 * archive a lesson type without deleting the row.
 */

const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, serverError } = require('../utils/response');

const TABLE = process.env.LESSON_TYPES_TABLE;

exports.handler = async () => {
  try {
    const items = [];
    let key;
    do {
      const r = await ddb.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: '#a = :true',
        ExpressionAttributeNames: { '#a': 'active' },
        ExpressionAttributeValues: { ':true': true },
        ExclusiveStartKey: key,
      }));
      items.push(...(r.Items || []));
      key = r.LastEvaluatedKey;
    } while (key);

    const lessonTypes = items
      .map((it) => ({
        id:           it.id,
        label:        it.label,
        priceCents:   it.priceCents,
        numPersons:   it.numPersons ?? 1,
        sessionCount: it.sessionCount ?? 1,
      }))
      .sort((a, b) => {
        // Re-fetch sortOrder from the original items for stable ordering.
        const aOrder = items.find((i) => i.id === a.id)?.sortOrder ?? 999;
        const bOrder = items.find((i) => i.id === b.id)?.sortOrder ?? 999;
        return aOrder - bOrder;
      });

    return ok({ lessonTypes });
  } catch (err) {
    console.error('getLessonTypes error:', err);
    return serverError();
  }
};
