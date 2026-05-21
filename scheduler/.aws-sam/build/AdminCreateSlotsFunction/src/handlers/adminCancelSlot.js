'use strict';

/**
 * DELETE /admin/slots/{id}
 *
 * Cancels a single slot. Refuses (409) if a confirmed booking exists on
 * the same (date, start) — the owner must cancel the booking first
 * (which refunds it through the normal cancellation flow), then cancel
 * the slot.
 *
 * "Cancel" here = soft-delete: status flips to 'cancelled', the row stays
 * for audit. Availability filters by status='active' so the slot
 * disappears from the public booking flow immediately.
 */

const { GetCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, notFound, serverError } = require('../utils/response');
const crypto = require('crypto');

const SLOTS_TABLE    = process.env.SLOTS_TABLE;
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;
const ADMIN_SECRET   = process.env.ADMIN_SECRET;

exports.handler = async (event) => {
  try {
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!ADMIN_SECRET || !supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    const id = event.pathParameters?.id;
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return badRequest('Invalid slot ID');
    }

    // Look up the slot.
    const existing = await ddb.send(new GetCommand({
      TableName: SLOTS_TABLE,
      Key: { PK: `SLOT#${id}` },
    }));
    if (!existing.Item) return notFound('Slot not found');

    const slot = existing.Item;
    if (slot.status === 'cancelled') {
      return ok(strip(slot));
    }

    // Refuse if there's a confirmed booking on the same date+start.
    const bookings = await ddb.send(new QueryCommand({
      TableName: BOOKINGS_TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date AND #t = :start',
      FilterExpression: '#s IN (:pending, :confirmed)',
      ExpressionAttributeNames: { '#d': 'date', '#t': 'timeSlot', '#s': 'status' },
      ExpressionAttributeValues: {
        ':date': slot.date,
        ':start': slot.start,
        ':pending': 'pending',
        ':confirmed': 'confirmed',
      },
      Limit: 1,
    }));
    if ((bookings.Items || []).length > 0) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Slot has an active booking. Cancel the booking first (which refunds it), then cancel the slot.',
          conflictingBookingId: bookings.Items[0].bookingId,
        }),
      };
    }

    const now = new Date().toISOString();
    const updated = await ddb.send(new UpdateCommand({
      TableName: SLOTS_TABLE,
      Key: { PK: `SLOT#${id}` },
      UpdateExpression: 'SET #s = :cancelled, cancelledAt = :now',
      ConditionExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':cancelled': 'cancelled',
        ':active':    'active',
        ':now':       now,
      },
      ReturnValues: 'ALL_NEW',
    }));

    return ok(strip(updated.Attributes));
  } catch (err) {
    console.error('adminCancelSlot error:', err);
    if (err.name === 'ConditionalCheckFailedException') {
      // Lost a race — refetch and return current state.
      const refetch = await ddb.send(new GetCommand({
        TableName: SLOTS_TABLE,
        Key: { PK: `SLOT#${event.pathParameters?.id}` },
      }));
      if (refetch.Item) return ok(strip(refetch.Item));
    }
    return serverError();
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
