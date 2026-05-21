'use strict';

/**
 * POST /admin/bookings
 *
 * Studio-side booking creation. Authenticated by an X-Admin-Secret header
 * matching the ADMIN_SECRET env var. Skips PayPal entirely — the slot is
 * marked confirmed immediately. Use cases:
 *   - Phone / Instagram booking with bank-transfer or cash payment.
 *   - Comp slot for a friend or employee.
 *   - "Held" slot — block off the schedule for cleaning, private use, etc.
 *
 * Body:
 *   {
 *     "date": "2026-05-12",
 *     "start": "14:00",
 *     "bookingType": "student" | "held",   // default "student"
 *     "studentName": "Jane Smith",         // required if bookingType=student
 *     "studentEmail": "jane@example.com",  // required if sendStudentEmail=true
 *     "paymentMethod": "manual" | "none",  // default "manual" for student, "none" for held
 *     "paymentNote": "Bank transfer Apr 10",
 *     "amountCents": 9500,                 // default PRICE_CENTS
 *     "sendStudentEmail": true             // default true if type=student
 *   }
 */

const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ddb } = require('../utils/dynamo');
const { ok, badRequest, serverError } = require('../utils/response');
const { findSlot, isValidDateString } = require('../utils/slots');
const { sendBookingConfirmation, sendOwnerNotification } = require('../email');
const { insertBookingEvent } = require('../utils/googleCalendar');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const TABLE         = process.env.BOOKINGS_TABLE;
const PRICE_CENTS   = parseInt(process.env.PRICE_CENTS || '9500', 10);
const ADMIN_SECRET  = process.env.ADMIN_SECRET;

exports.handler = async (event) => {
  try {
    if (!ADMIN_SECRET) {
      console.warn('ADMIN_SECRET not configured — refusing all admin requests');
      return unauthorized();
    }
    const supplied = event.headers?.['x-admin-secret'] || event.headers?.['X-Admin-Secret'];
    if (!supplied || !timingSafeEq(supplied, ADMIN_SECRET)) {
      return unauthorized();
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return badRequest('Invalid JSON body');
    }

    const {
      date,
      start,
      bookingType     = 'student',
      studentName,
      studentEmail,
      paymentMethod,
      paymentNote,
      amountCents,
      sendStudentEmail,
    } = body;

    // ── Validate ───────────────────────────────────────────────────────────
    if (!date || !start) return badRequest('Missing required fields: date, start');
    if (!isValidDateString(date)) return badRequest('Invalid date. Use YYYY-MM-DD format.');
    if (bookingType !== 'student' && bookingType !== 'held') {
      return badRequest('bookingType must be "student" or "held"');
    }

    const slot = await findSlot(date, start);
    if (!slot) return badRequest('No workshop slot at that date and start time.');

    if (bookingType === 'student') {
      if (!studentName || studentName.trim().length < 2) {
        return badRequest('studentName is required for student bookings (min 2 chars)');
      }
      // studentEmail is required only when we plan to send the confirmation.
      // Default sendStudentEmail to true; admin can opt out by setting false.
      const wantsEmail = sendStudentEmail !== false;
      if (wantsEmail && (!studentEmail || !studentEmail.includes('@'))) {
        return badRequest('studentEmail is required when sendStudentEmail is true');
      }
    }

    const effectivePaymentMethod = bookingType === 'held'
      ? 'none'
      : (paymentMethod || 'manual');

    if (!['paypal', 'manual', 'none'].includes(effectivePaymentMethod)) {
      return badRequest('paymentMethod must be one of: paypal, manual, none');
    }
    if (effectivePaymentMethod === 'paypal') {
      // Admin endpoint doesn't talk to PayPal — that's what /bookings is for.
      return badRequest('paymentMethod=paypal is not supported on the admin endpoint; use /bookings');
    }

    const effectiveAmountCents = bookingType === 'held'
      ? 0
      : (Number.isFinite(amountCents) ? amountCents : PRICE_CENTS);

    // ── Slot availability ──────────────────────────────────────────────────
    const existing = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'date-index',
      KeyConditionExpression: '#d = :date AND #t = :slot',
      FilterExpression: '#s IN (:pending, :confirmed)',
      ExpressionAttributeNames: { '#d': 'date', '#t': 'timeSlot', '#s': 'status' },
      ExpressionAttributeValues: {
        ':date': date,
        ':slot': start,
        ':pending': 'pending',
        ':confirmed': 'confirmed',
      },
      Limit: 1,
    }));
    if ((existing.Items || []).length > 0) {
      return badRequest('This time slot is no longer available.');
    }

    // ── Persist as confirmed (no PayPal involvement) ────────────────────────
    const bookingId = uuidv4();
    const now       = new Date().toISOString();

    const item = {
      PK:            `BOOKING#${bookingId}`,
      bookingId,
      date,
      timeSlot:      slot.start,
      slotEnd:       slot.end,
      status:        'confirmed',
      bookingType,
      paymentMethod: effectivePaymentMethod,
      amountCents:   effectiveAmountCents,
      createdAt:     now,
      confirmedAt:   now,
    };
    if (bookingType === 'student') {
      item.studentName = studentName.trim();
      if (studentEmail) item.studentEmail = studentEmail.trim().toLowerCase();
    }
    if (paymentNote) item.paymentNote = String(paymentNote).slice(0, 500);

    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: 'attribute_not_exists(PK)',
    }));

    // ── Side-effect emails ─────────────────────────────────────────────────
    // Student email only if (a) it's a student booking, (b) we have an email,
    // and (c) admin didn't suppress it. Owner email always fires.
    const wantsStudentEmail = bookingType === 'student'
      && item.studentEmail
      && sendStudentEmail !== false;

    await Promise.all([
      wantsStudentEmail ? sendBookingConfirmation(item) : Promise.resolve(false),
      sendOwnerNotification(item),
      insertBookingEvent(item).catch((e) => {
        console.error('googleCalendar insert failed', { bookingId: item.bookingId, error: e?.message || e });
      }),
    ]);

    return ok(stripBooking(item));
  } catch (err) {
    console.error('adminCreateBooking error:', err);
    return serverError();
  }
};

function unauthorized() {
  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: 'Unauthorized' }),
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
    bookingId:     item.bookingId,
    date:          item.date,
    timeSlot:      item.timeSlot,
    slotEnd:       item.slotEnd,
    status:        item.status,
    bookingType:   item.bookingType,
    paymentMethod: item.paymentMethod,
    paymentNote:   item.paymentNote,
    amountCents:   item.amountCents,
    studentName:   item.studentName,
    studentEmail:  item.studentEmail,
    createdAt:     item.createdAt,
    confirmedAt:   item.confirmedAt,
  };
}
