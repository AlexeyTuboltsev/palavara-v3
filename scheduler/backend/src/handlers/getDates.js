'use strict';

/**
 * GET /dates
 *
 * Returns the list of upcoming dates that have at least one workshop slot.
 * The frontend uses this to populate the date picker so users can only choose
 * dates that actually have workshops.
 */

const { ok, serverError } = require('../utils/response');
const { getAvailableDates } = require('../utils/slots');

exports.handler = async () => {
  try {
    return ok({ dates: getAvailableDates() });
  } catch (err) {
    console.error('getDates error:', err);
    return serverError();
  }
};
