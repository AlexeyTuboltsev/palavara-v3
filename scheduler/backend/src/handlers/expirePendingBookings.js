'use strict';

/**
 * Scheduled (EventBridge) sweep that flips abandoned `pending` bookings
 * to `expired` so their slot capacity frees up.
 *
 * A booking is `pending` from the moment we write it (right after creating
 * the PayPal order) until the capture webhook flips it to `confirmed`.
 * Users who close the tab mid-PayPal — or whose payment fails after the
 * order was created — leave a row sitting forever, silently reserving
 * seats (`createBooking.js` counts both `pending` and `confirmed` toward
 * slot capacity).
 *
 * PayPal Orders v2 orders are themselves valid for ~3h, so anything past
 * that on our side can never be captured anyway. 30 min is the default
 * here — covers slow checkouts (PayPal login, 2FA, return-URL race) with
 * margin, frees the seat well before another customer would notice the
 * phantom reservation.
 *
 * Mark, don't delete. The row survives for analytics + audit; the new
 * status is excluded from the `IN (pending, confirmed)` capacity filter
 * elsewhere, so the seat returns to availability instantly.
 */

const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');

const TABLE = process.env.BOOKINGS_TABLE;

/** Minutes a `pending` row is allowed to live before it's swept. */
const TTL_MIN = parseInt(process.env.PENDING_TTL_MINUTES || '30', 10);

exports.handler = async () => {
  const cutoff = new Date(Date.now() - TTL_MIN * 60 * 1000).toISOString();
  const now    = new Date().toISOString();

  // One paginated scan with a server-side filter. The bookings table is
  // small (single-studio, single-digit bookings per day) so scan cost is
  // a rounding error vs. a secondary index — when the table grows past
  // a few thousand rows, swap in a status-createdAt GSI.
  const stale = [];
  let lastKey;
  do {
    const r = await ddb.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: '#s = :pending AND createdAt < :cutoff',
      ExpressionAttributeNames:  { '#s': 'status' },
      ExpressionAttributeValues: { ':pending': 'pending', ':cutoff': cutoff },
      ExclusiveStartKey: lastKey,
    }));
    stale.push(...(r.Items || []));
    lastKey = r.LastEvaluatedKey;
  } while (lastKey);

  if (stale.length === 0) {
    console.log('expire-pending: nothing to do', { cutoff });
    return { expired: 0 };
  }

  // Conditional update so a row that flipped to `confirmed` between the
  // scan and the update (rare but possible) doesn't get clobbered.
  let expired = 0;
  for (const item of stale) {
    try {
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { PK: item.PK },
        UpdateExpression: 'SET #s = :expired, expiredAt = :now',
        ConditionExpression: '#s = :pending',
        ExpressionAttributeNames:  { '#s': 'status' },
        ExpressionAttributeValues: { ':expired': 'expired', ':pending': 'pending', ':now': now },
      }));
      expired++;
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        // Row flipped to confirmed (or already expired) since the scan. Skip.
        continue;
      }
      console.error('expire-pending: update failed', { PK: item.PK, error: err?.message || err });
    }
  }

  console.log('expire-pending: done', { scanned: stale.length, expired, cutoff });
  return { scanned: stale.length, expired };
};
