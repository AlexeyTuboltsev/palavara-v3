'use strict';

/**
 * Short, human-readable booking ids.
 *
 * 6 characters from a 28-symbol alphabet:
 *   - Uppercase A–V minus I/O (confusable with 1/0).
 *   - Digits 2–9 (skip 0/1 for the same reason).
 *
 * 28^6 = ~482M possibilities. The studio will never come anywhere near
 * filling that, so the conditional Put on the bookings table is enough
 * to guard against the astronomically rare collision — no retry loop.
 *
 * The alphabet was picked to stay inside Google Calendar's event-id
 * constraint ([a-v0-9] when lowercased), so eventIdFromBookingId can
 * map straight through with just .toLowerCase() for both new short ids
 * and the legacy UUID format that still lives in the table.
 *
 * Old UUID booking ids (pre-2026-05-20) coexist with new short ids —
 * everything that consumes the id treats it as an opaque string.
 */

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUV23456789'; // 28 chars, no I/O/W/X/Y/Z/0/1
const ID_LENGTH = 6;

/** Generate a fresh 6-char booking id. */
function generateBookingId() {
  const bytes = crypto.randomBytes(ID_LENGTH);
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Accept both new short ids and legacy UUIDs. The pattern is deliberately
 * lax — it exists only to keep obvious path-traversal / SQL-injection
 * shapes out, not to enforce a specific format. The DDB lookup is the
 * real source of truth.
 */
const BOOKING_ID_PATTERN = /^[A-Za-z0-9-]{6,64}$/;

function isValidBookingId(id) {
  return typeof id === 'string' && BOOKING_ID_PATTERN.test(id);
}

module.exports = { generateBookingId, isValidBookingId };
