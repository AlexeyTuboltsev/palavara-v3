'use strict';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function ok(body) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

function created(body) {
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

function badRequest(message) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify({ error: message }),
  };
}

function notFound(message = 'Not found') {
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify({ error: message }),
  };
}

function serverError(message = 'Internal server error') {
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify({ error: message }),
  };
}

module.exports = { ok, created, badRequest, notFound, serverError };
