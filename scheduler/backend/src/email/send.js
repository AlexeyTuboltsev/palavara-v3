'use strict';

/**
 * Low-level SES sender. Builds a multipart/mixed Raw MIME message
 * carrying a text+html body and (optionally) an .ics calendar
 * attachment. Pass `icsContent: undefined` to skip the attachment —
 * student-facing emails do this since clients almost always already
 * have the booking on a calendar via PayPal/Google.
 *
 * Failures are logged but never throw. The booking is the source of
 * truth in DynamoDB; email is best-effort.
 */

const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({ region: process.env.AWS_REGION || 'eu-central-1' });

const FROM_ADDRESS = process.env.SES_FROM_ADDRESS;

/** RFC 2047 encoded-word for non-ASCII Subject lines (UTF-8 / base64). */
function encodeMimeHeader(s) {
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

async function sendWithIcs({
  to,
  subject,
  text,
  html,
  icsContent,
  icsFilename,
  icsMethod = 'REQUEST',
  replyTo,
  logTag,
  bookingId,
}) {
  const boundary    = `b1_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const altBoundary = `b2_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: ${FROM_ADDRESS}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeMimeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean).join('\r\n');

  const bodyParts = [
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${altBoundary}--`,
    '',
  ];

  if (icsContent) {
    bodyParts.push(
      `--${boundary}`,
      `Content-Type: text/calendar; method=${icsMethod}; charset=UTF-8; name="${icsFilename}"`,
      `Content-Disposition: attachment; filename="${icsFilename}"`,
      'Content-Transfer-Encoding: 8bit',
      '',
      icsContent,
    );
  }

  bodyParts.push(`--${boundary}--`, '');
  const body = bodyParts.join('\r\n');

  const rawMessage = headers + '\r\n\r\n' + body;

  try {
    await ses.send(new SendEmailCommand({
      Content: { Raw: { Data: Buffer.from(rawMessage, 'utf8') } },
    }));
    console.log(`${logTag} email sent`, { bookingId, to });
    return true;
  } catch (err) {
    console.error(`${logTag} SES send failed`, { bookingId, to, error: err?.message || err });
    return false;
  }
}

module.exports = { sendWithIcs, FROM_ADDRESS };
