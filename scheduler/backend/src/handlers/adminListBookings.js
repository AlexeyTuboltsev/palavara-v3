'use strict';

/**
 * GET /admin/bookings?status=&from=&to=
 *
 * Studio-side listing of bookings for the admin UI. Authenticated by an
 * X-Admin-Secret header matching the ADMIN_SECRET env var.
 *
 * Query parameters (all optional):
 *   status — pending | confirmed | cancelled | all (default: all)
 *   from   — YYYY-MM-DD inclusive (default: today)
 *   to     — YYYY-MM-DD inclusive (default: open-ended)
 *
 * Implementation notes:
 *   - DynamoDB Scan with FilterExpression. Acceptable at MVP scale (low
 *     hundreds of rows). Switch to a per-date Query loop if the table grows.
 *   - Sorted ascending by (date, timeSlot) handler-side.
 */

const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest } = require('../utils/response');
const crypto = require('crypto');

const TABLE        = process.env.BOOKINGS_TABLE;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'all'];

exports.handler = async (event) => {
  try {
    if (!ADMIN_SECRET) {
      return unauthorized('ADMIN_SECRET not configured');
    }
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    const q = event.queryStringParameters || {};
    const status = q.status || 'all';
    if (!VALID_STATUSES.includes(status)) {
      return badRequest(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const today = new Date().toISOString().slice(0, 10);
    const from = q.from || today;
    const to   = q.to || undefined;
    if (!isValidIsoDate(from) || (to && !isValidIsoDate(to))) {
      return badRequest('from / to must be YYYY-MM-DD');
    }

    // Build the FilterExpression dynamically based on which filters are set.
    const filters = ['attribute_exists(#d)', '#d >= :from'];
    const names   = { '#d': 'date' };
    const values  = { ':from': from };
    if (to) {
      filters.push('#d <= :to');
      values[':to'] = to;
    }
    if (status !== 'all') {
      filters.push('#s = :status');
      names['#s']      = 'status';
      values[':status'] = status;
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
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });

    return ok({
      bookings: items.map(stripBooking),
      count:    items.length,
    });
  } catch (err) {
    console.error('adminListBookings error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function isValidIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function unauthorized(msg = 'Unauthorized') {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: msg }),
  };
}

function timingSafeEq(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function stripBooking(item) {
  return {
    bookingId:           item.bookingId,
    date:                item.date,
    timeSlot:            item.timeSlot,
    slotEnd:             item.slotEnd,
    status:              item.status,
    bookingType:         item.bookingType || 'student',
    paymentMethod:       item.paymentMethod || 'paypal',
    paymentNote:         item.paymentNote,
    studentName:         item.studentName,
    studentEmail:        item.studentEmail,
    amountCents:         item.amountCents,
    refundedAmountCents: item.refundedAmountCents,
    paypalCaptureId:     item.paypalCaptureId,
    paypalRefundId:      item.paypalRefundId,
    cancelledAt:         item.cancelledAt,
    cancelledBy:         item.cancelledBy,
    cancellationReason:  item.cancellationReason,
    createdAt:           item.createdAt,
    confirmedAt:         item.confirmedAt,
  };
}
