'use strict';

/**
 * POST /bookings
 *
 * Two shapes, dispatched by whether `slots` is present:
 *
 *   Single session (lesson type sessionCount === 1):
 *     { date, start, studentName, studentEmail,
 *       lessonType,
 *       studentPhone?, comment? }
 *
 *   4-session cycle (lesson type sessionCount === 4):
 *     { slots: [{date, start}, ...x4],
 *       studentName, studentEmail,
 *       lessonType,
 *       studentPhone?, comment? }
 *
 * Server-trusted fields: amount AND person count both come from the
 * lesson-type catalog (`priceCents` / `numPersons`). Client-supplied
 * amount / numPersons are ignored. There is no per-person multiplication.
 *
 * Cycle writes go through DynamoDB TransactWriteItems so either all 4
 * rows land pending (and the 4 seats reserve atomically), or none do.
 *
 * The PayPal order is single (one charge for the whole booking); for
 * cycles, `custom_id` is the first-session bookingId and the webhook /
 * capture handler propagates the confirmation across cycle siblings via
 * cycleLogic.transactUpdateAll.
 */

const { PutCommand, QueryCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { findSlot, isValidDateString } = require('../utils/slots');
const { resolveLessonTypeAndPrice } = require('../utils/lessonTypes');
const { validateCycleSlots } = require('../utils/cycleLogic');
const { createOrder } = require('../utils/paypal');
const { generateBookingId } = require('../utils/bookingId');
const { v4: uuidv4 } = require('uuid');

const TABLE             = process.env.BOOKINGS_TABLE;
const PAYPAL_RETURN_URL = process.env.PAYPAL_RETURN_URL;
const PAYPAL_CANCEL_URL = process.env.PAYPAL_CANCEL_URL;
const PRICE_CURRENCY    = process.env.PRICE_CURRENCY || 'EUR';

const MAX_PHONE_CHARS   = 30;
const MAX_COMMENT_CHARS = 500;

exports.handler = async (event) => {
  try {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const {
      slots: rawSlots,
      date,
      start,
      studentName,
      studentEmail,
      studentPhone,
      lessonType,
      comment,
    } = body;

    // ── Common student-field validation ──────────────────────────────────────
    if (!studentName || !studentEmail) {
      return badRequest('Missing required fields: studentName, studentEmail');
    }
    if (!studentEmail.includes('@')) {
      return badRequest('Invalid email address');
    }
    if (studentName.trim().length < 2 || studentName.trim().length > 99) {
      return badRequest('Name must be between 2 and 99 characters');
    }

    // ── Resolve lesson type + price (trusted server-side) ────────────────────
    const priced = await resolveLessonTypeAndPrice({ lessonTypeId: lessonType });
    if (!priced.ok) return badRequest(priced.error);
    const { type: lessonTypeRow, numPersons: persons, amountCents } = priced;
    const sessionCount = lessonTypeRow.sessionCount ?? 1;
    const isCycle      = sessionCount > 1;

    // ── Cap free-form fields ─────────────────────────────────────────────────
    const trimmedPhone = typeof studentPhone === 'string'
      ? studentPhone.trim().slice(0, MAX_PHONE_CHARS)
      : '';
    const trimmedComment = typeof comment === 'string'
      ? comment.trim().slice(0, MAX_COMMENT_CHARS)
      : '';

    // ── Dispatch: single vs cycle ────────────────────────────────────────────
    if (isCycle) {
      return await createCycleBooking({
        rawSlots,
        sessionCount,
        studentName,
        studentEmail,
        trimmedPhone,
        trimmedComment,
        lessonTypeRow,
        persons,
        amountCents,
      });
    }

    return await createSingleBooking({
      date,
      start,
      studentName,
      studentEmail,
      trimmedPhone,
      trimmedComment,
      lessonTypeRow,
      persons,
      amountCents,
    });
  } catch (err) {
    console.error('createBooking error:', err);
    return serverError();
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Single-session path
// ──────────────────────────────────────────────────────────────────────────────
async function createSingleBooking({
  date, start, studentName, studentEmail, trimmedPhone, trimmedComment,
  lessonTypeRow, persons, amountCents,
}) {
  if (!date || !start) {
    return badRequest('Missing required fields: date, start');
  }
  if (!isValidDateString(date)) {
    return badRequest('Invalid date. Use YYYY-MM-DD format.');
  }

  const slot = await findSlot(date, start);
  if (!slot) {
    return badRequest('No workshop slot at that date and start time.');
  }

  const existing = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'date-index',
    KeyConditionExpression: '#d = :date AND #t = :slot',
    FilterExpression: '#s IN (:pending, :confirmed)',
    ExpressionAttributeNames: { '#d': 'date', '#t': 'timeSlot', '#s': 'status' },
    ExpressionAttributeValues: {
      ':date': date,
      ':slot': start,
      ':pending':   'pending',
      ':confirmed': 'confirmed',
    },
    Limit: 1,
  }));

  if ((existing.Items || []).length > 0) {
    return badRequest('This time slot is no longer available. Please choose another.');
  }

  const bookingId = generateBookingId();
  const returnUrl = appendQuery(PAYPAL_RETURN_URL, { bookingId });
  const cancelUrl = appendQuery(PAYPAL_CANCEL_URL, { bookingId });

  const { orderId, approveUrl } = await createOrder({
    bookingId,
    amountCents,
    currency:   PRICE_CURRENCY,
    returnUrl,
    cancelUrl,
  });

  const now  = new Date().toISOString();
  const item = {
    PK:              `BOOKING#${bookingId}`,
    bookingId,
    date,
    timeSlot:        slot.start,
    slotEnd:         slot.end,
    status:          'pending',
    bookingType:     'student',
    paymentMethod:   'paypal',
    studentName:     studentName.trim(),
    studentEmail:    studentEmail.trim().toLowerCase(),
    paypalOrderId:   orderId,
    amountCents,
    lessonTypeId:    lessonTypeRow.id,
    lessonTypeLabel: lessonTypeRow.label,
    numPersons:      persons,
    createdAt:       now,
  };
  if (trimmedPhone)   item.studentPhone = trimmedPhone;
  if (trimmedComment) item.comment      = trimmedComment;

  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(PK)',
  }));

  return ok({ bookingId, approveUrl });
}

// ──────────────────────────────────────────────────────────────────────────────
// Cycle path — N rows linked by cycleId, single PayPal order for the bundle
// ──────────────────────────────────────────────────────────────────────────────
async function createCycleBooking({
  rawSlots, sessionCount, studentName, studentEmail, trimmedPhone, trimmedComment,
  lessonTypeRow, persons, amountCents,
}) {
  const v = validateCycleSlots(rawSlots, sessionCount);
  if (!v.ok) return badRequest(v.error);
  const slots = v.slots;

  // Every slot must exist in the slots table — `findSlot` returns the
  // canonical {start, end} pair so we don't trust the client's start.
  const resolvedSlots = [];
  for (const s of slots) {
    if (!isValidDateString(s.date)) {
      return badRequest(`Invalid date for session ${s.sessionIndex}: ${s.date}`);
    }
    const slot = await findSlot(s.date, s.start);
    if (!slot) {
      return badRequest(`No workshop slot for session ${s.sessionIndex} (${s.date} ${s.start})`);
    }
    resolvedSlots.push({
      date:         s.date,
      timeSlot:     slot.start,
      slotEnd:      slot.end,
      sessionIndex: s.sessionIndex,
    });
  }

  // Capacity: each slot must be free of any pending/confirmed booking.
  // Sequential queries are fine — N=4, low traffic. If this ever loads up,
  // a single Scan + in-memory filter would be cheaper than 4 round-trips.
  for (const s of resolvedSlots) {
    const existing = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date AND #t = :slot',
      FilterExpression: '#s IN (:pending, :confirmed)',
      ExpressionAttributeNames: { '#d': 'date', '#t': 'timeSlot', '#s': 'status' },
      ExpressionAttributeValues: {
        ':date': s.date,
        ':slot': s.timeSlot,
        ':pending':   'pending',
        ':confirmed': 'confirmed',
      },
      Limit: 1,
    }));
    if ((existing.Items || []).length > 0) {
      return badRequest(`Session ${s.sessionIndex} (${s.date} ${s.timeSlot}) is no longer available.`);
    }
  }

  // One PayPal order for the bundle. custom_id is the FIRST session's
  // bookingId — the webhook handler uses it to look up the row, then
  // propagates the confirmation across cycle siblings.
  // cycleId stays a UUID — internal-only, never surfaced to the user.
  const cycleId   = uuidv4();
  const bookingIds = resolvedSlots.map(() => generateBookingId());
  const firstBookingId = bookingIds[0];

  const returnUrl = appendQuery(PAYPAL_RETURN_URL, { bookingId: firstBookingId });
  const cancelUrl = appendQuery(PAYPAL_CANCEL_URL, { bookingId: firstBookingId });

  const { orderId, approveUrl } = await createOrder({
    bookingId: firstBookingId,
    amountCents,
    currency:  PRICE_CURRENCY,
    returnUrl,
    cancelUrl,
  });

  const now = new Date().toISOString();
  const rows = resolvedSlots.map((s, i) => {
    const row = {
      PK:              `BOOKING#${bookingIds[i]}`,
      bookingId:       bookingIds[i],
      cycleId,
      sessionIndex:    s.sessionIndex,
      sessionCount,
      date:            s.date,
      timeSlot:        s.timeSlot,
      slotEnd:         s.slotEnd,
      status:          'pending',
      bookingType:     'student',
      paymentMethod:   'paypal',
      studentName:     studentName.trim(),
      studentEmail:    studentEmail.trim().toLowerCase(),
      paypalOrderId:   orderId,
      amountCents,     // bundle total, denormalised across all N rows
      lessonTypeId:    lessonTypeRow.id,
      lessonTypeLabel: lessonTypeRow.label,
      numPersons:      persons,
      createdAt:       now,
    };
    if (trimmedPhone)   row.studentPhone = trimmedPhone;
    if (trimmedComment) row.comment      = trimmedComment;
    return row;
  });

  // TransactWriteItems caps at 100 — N=4 is well under. Either all 4 rows
  // land or none do; partial state is impossible by design.
  await ddb.send(new TransactWriteCommand({
    TransactItems: rows.map((Item) => ({
      Put: {
        TableName: TABLE,
        Item,
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    })),
  }));

  return ok({ bookingId: firstBookingId, cycleId, approveUrl });
}

function appendQuery(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}
