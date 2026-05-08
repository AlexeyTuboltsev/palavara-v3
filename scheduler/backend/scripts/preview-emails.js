#!/usr/bin/env node
/**
 * Render every HTML email template with realistic mock data so you can
 * eyeball them in a browser without sending real mail.
 *
 *   node scheduler/backend/scripts/preview-emails.js
 *
 * Output: scheduler/frontend/email-preview/{index.html, *.html}.
 * Visit http://localhost:5173/email-preview/ in the running dev server.
 *
 * The preview folder is gitignored and excluded from the production
 * deploy — see scheduler/frontend/.gitignore + the deploy workflow.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { renderTemplate } = require('../src/email/render');

// ── Where to write ─────────────────────────────────────────────────────
const OUT_DIR = path.join(__dirname, '..', '..', 'frontend', 'email-preview');
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Shared values for every render ─────────────────────────────────────
// Relative path so the dev server (scheduler/frontend/) renders the local
// logo.svg copy without needing the studio-site deploy to be live first.
// Production code references the absolute https URL — see src/email/index.js.
const LOGO_URL  = '../logo.svg';
const STUDIO_URL = 'https://studio.palavara.com/';
const STUDIO_ADDRESS = 'Steegerstr. 1A, 13359 Berlin';

// Mirrors the constants in src/email/index.js so previews render the
// real footer block. Update both in lockstep.
const IMPRESSUM_TEXT =
  '\n--\nPalavara Studio · Varvara Polyakova\n' +
  'Steegerstr. 1A, 13359 Berlin · palavarastudio@gmail.com\n' +
  'Impressum: https://studio.palavara.com/impressum · ' +
  'AGB: https://studio.palavara.com/agb · ' +
  'Datenschutz: https://studio.palavara.com/datenschutzerklaerung';

const IMPRESSUM_HTML =
  '<p style="color:#6b7280; font-size: 11px; line-height: 1.6; margin-top: 16px;">'
  + 'Palavara Studio · Varvara Polyakova<br/>'
  + 'Steegerstr. 1A, 13359 Berlin · '
  + '<a href="mailto:palavarastudio@gmail.com" style="color:#6b7280;">palavarastudio@gmail.com</a><br/>'
  + '<a href="https://studio.palavara.com/impressum" style="color:#6b7280;">Impressum</a> · '
  + '<a href="https://studio.palavara.com/agb" style="color:#6b7280;">AGB</a> · '
  + '<a href="https://studio.palavara.com/datenschutzerklaerung" style="color:#6b7280;">Datenschutzerklärung</a>'
  + '</p>';

// ── Variants ───────────────────────────────────────────────────────────
const variants = [
  {
    name: 'booking-student',
    title: 'Booking confirmation — student',
    description: '€95 single lesson, paid via PayPal.',
    template: 'booking-student',
    ctx: {
      studentName: 'Jane Smith',
      dateLine: 'Tuesday, 15 May 2026',
      timeLine: '14:00 – 16:00',
      studioAddress: STUDIO_ADDRESS,
      cancelUrl: 'https://book.palavara.com/cancel.html?bookingId=demo&token=xyz',
      bookingId: 'preview-0000-0000-aaaa',
      logoUrl: LOGO_URL,
      studioUrl: STUDIO_URL,
      lessonLabel: 'Single lesson',
      lessonLabelLower: 'single lesson',
      priceLineIndented: '\n  Price: €95.00 (paid via PayPal)',
      priceRowHtml:
        '<tr><td style="color:#6b7280">Payment</td><td>Price: €95.00 (paid via PayPal)</td></tr>',
    },
  },
  {
    name: 'booking-owner-student',
    title: 'Booking notification — owner (student booking, with phone + comment)',
    description: 'Group lesson, 3 people, €255. Booker added phone and a comment.',
    template: 'booking-owner-student',
    ctx: {
      studentName: 'Jane Smith',
      studentEmail: 'jane@example.com',
      dateLine: 'Tuesday, 15 May 2026',
      timeLine: '14:00 – 16:00',
      bookingId: 'preview-0000-0000-bbbb',
      cancelUrl: 'https://book.palavara.com/cancel.html?bookingId=demo&token=xyz',
      logoUrl: LOGO_URL,
      studioUrl: STUDIO_URL,
      lessonLabel: 'Group lesson',
      lessonLabelLower: 'group lesson',
      priceLineIndented: '\n  Price: €255.00 (paid via PayPal)',
      priceRowHtml:
        '<tr><td style="color:#6b7280">Payment</td><td>Price: €255.00 (paid via PayPal)</td></tr>',
      paymentNoteIndented: '',
      paymentNoteRowHtml: '',
      phoneBlockText: '\n  Phone:      +49 30 12345678',
      phoneRowHtml:
        '<tr><td style="color:#6b7280">Phone</td><td>+49 30 12345678</td></tr>',
      commentBlockText:
        '\n\nComment:\n  First time! Bringing my partner and a friend.\n  We\'re all complete beginners — looking forward to it.',
      commentBlockHtml:
        '<p style="margin: 16px 0 4px; color:#6b7280; font-size: 13px;">Comment</p>'
        + '<p style="margin: 0; white-space: pre-wrap;">First time! Bringing my partner and a friend.\nWe&#39;re all complete beginners — looking forward to it.</p>',
    },
  },
  {
    name: 'booking-owner-student-minimal',
    title: 'Booking notification — owner (no phone, no comment)',
    description: 'Single lesson, no optional fields filled in.',
    template: 'booking-owner-student',
    ctx: {
      studentName: 'Alex Wong',
      studentEmail: 'alex@example.com',
      dateLine: 'Saturday, 25 May 2026',
      timeLine: '11:00 – 13:00',
      bookingId: 'preview-0000-0000-cccc',
      cancelUrl: 'https://book.palavara.com/cancel.html?bookingId=demo&token=xyz',
      logoUrl: LOGO_URL,
      studioUrl: STUDIO_URL,
      lessonLabel: 'Single lesson',
      lessonLabelLower: 'single lesson',
      priceLineIndented: '\n  Price: €95.00 (paid via PayPal)',
      priceRowHtml:
        '<tr><td style="color:#6b7280">Payment</td><td>Price: €95.00 (paid via PayPal)</td></tr>',
      paymentNoteIndented: '',
      paymentNoteRowHtml: '',
      phoneBlockText: '',
      phoneRowHtml: '',
      commentBlockText: '',
      commentBlockHtml: '',
    },
  },
  {
    name: 'booking-owner-held',
    title: 'Held-slot notification — owner',
    description: 'Studio admin held a slot off the public schedule (with a note).',
    template: 'booking-owner-held',
    ctx: {
      dateLine: 'Friday, 23 May 2026',
      timeLine: '17:00 – 19:00',
      bookingId: 'preview-0000-0000-dddd',
      logoUrl: LOGO_URL,
      studioUrl: STUDIO_URL,
      paymentNoteIndented: '\n  Note:       Studio cleaning before the open day',
      paymentNoteRowHtml:
        '<tr><td style="color:#6b7280">Note</td><td>Studio cleaning before the open day</td></tr>',
      paymentNoteParenthesized: ' (Studio cleaning before the open day)',
      paymentNoteDashed: ' — Studio cleaning before the open day',
      paymentNoteDashedHtml: ' — Studio cleaning before the open day',
    },
  },
  {
    name: 'cancel-student',
    title: 'Cancellation — student (cancelled by student, refunded)',
    description: '>48h before, full refund issued.',
    template: 'cancel-student',
    ctx: {
      studentName: 'Jane Smith',
      dateLine: 'Tuesday, 15 May 2026',
      timeLine: '14:00 – 16:00',
      bookingId: 'preview-0000-0000-eeee',
      logoUrl: LOGO_URL,
      studioUrl: STUDIO_URL,
      lead: 'Your single lesson has been cancelled.',
      refundLine: '€95.00 has been refunded to your PayPal account.',
      closing: 'You can book another workshop at https://book.palavara.com/ whenever you like.',
      closingHtml:
        '<p>You can book another workshop at <a href="https://book.palavara.com/">book.palavara.com</a> whenever you like.</p>',
    },
  },
  {
    name: 'cancel-owner',
    title: 'Cancellation — owner notification',
    description: 'Cancelled by student, refund processed.',
    template: 'cancel-owner',
    ctx: {
      cancelledBy: 'student',
      studentName: 'Jane Smith',
      studentEmail: 'jane@example.com',
      dateLine: 'Tuesday, 15 May 2026',
      timeLine: '14:00 – 16:00',
      bookingId: 'preview-0000-0000-ffff',
      logoUrl: LOGO_URL,
      studioUrl: STUDIO_URL,
      refundLine: 'Refund: €95.00 processed (PayPal refund id 1XX84336LG453953M)',
    },
  },
];

// ── Render ─────────────────────────────────────────────────────────────
const indexLinks = [];

for (const v of variants) {
  const ctx = { ...v.ctx, impressumText: IMPRESSUM_TEXT, impressumHtml: IMPRESSUM_HTML };
  const r = renderTemplate(v.template, ctx);
  const wrapped =
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Email preview — ${v.title}</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f3f4f6; color: #111; }
    .frame { max-width: 720px; margin: 0 auto; padding: 24px; }
    .meta { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
    .meta h1 { font-size: 1.05rem; margin: 0 0 4px; }
    .meta p { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .meta .subj { font-family: ui-monospace, monospace; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px; font-size: 0.85rem; }
    .meta a { color: #1a73e8; text-decoration: none; font-size: 0.85rem; }
    .body { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="meta">
      <h1>${v.title}</h1>
      <p>${v.description}</p>
      <span class="subj">Subject: ${escapeHtml(r.subject)}</span>
      <p style="margin-top: 12px;"><a href="index.html">← All previews</a></p>
    </div>
    <div class="body">
${r.html}
    </div>
  </div>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, v.name + '.html'), wrapped, 'utf8');
  indexLinks.push({ href: v.name + '.html', title: v.title, description: v.description });
}

// ── Index page ─────────────────────────────────────────────────────────
const indexHtml =
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Palavara Studio — email previews</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f3f4f6; color: #111; }
    .frame { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
    h1 { font-size: 1.4rem; margin: 0 0 8px; }
    .lede { color: #6b7280; margin: 0 0 24px; }
    a.card { display: block; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; text-decoration: none; color: inherit; }
    a.card:hover { border-color: #1a73e8; }
    a.card h2 { margin: 0 0 4px; font-size: 1rem; color: #1a73e8; }
    a.card p { margin: 0; color: #6b7280; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="frame">
    <h1>Email previews</h1>
    <p class="lede">Rendered with mock booking data — what each template actually puts in the inbox.</p>
${indexLinks.map((l) =>
  `    <a class="card" href="${l.href}"><h2>${l.title}</h2><p>${l.description}</p></a>`
).join('\n')}
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml, 'utf8');

console.log(`Wrote ${variants.length + 1} files to ${OUT_DIR}`);
console.log(`Open: http://localhost:5173/email-preview/`);

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
