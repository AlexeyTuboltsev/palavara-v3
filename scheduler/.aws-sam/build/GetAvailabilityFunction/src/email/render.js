'use strict';

/**
 * Email template renderer.
 *
 * Each template lives in templates/<name>/ with subject.txt, body.txt,
 * and body.html. Substitution syntax:
 *
 *   - {{var}}    — value from ctx, HTML-escaped in body.html, inserted
 *                  raw in subject.txt and body.txt.
 *   - {{{var}}}  — value from ctx, inserted raw in all three files.
 *                  Use for pre-built HTML fragments (e.g. a conditional
 *                  table row built in JS) or values you've already
 *                  escaped yourself.
 *
 * Templates are loaded synchronously at module init and cached. Lambda
 * containers get a small one-time hit on cold start; warm invocations
 * pay nothing.
 */

const fs = require('fs');
const path = require('path');
const { escapeHtml } = require('./helpers');

const TEMPLATE_DIR = path.join(__dirname, 'templates');

/** Discovered at init: { name: { subject, text, html } }. */
const cache = new Map();

(function loadAll() {
  for (const name of fs.readdirSync(TEMPLATE_DIR)) {
    const dir = path.join(TEMPLATE_DIR, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    cache.set(name, {
      subject: fs.readFileSync(path.join(dir, 'subject.txt'), 'utf8').trimEnd(),
      text:    fs.readFileSync(path.join(dir, 'body.txt'),    'utf8'),
      html:    fs.readFileSync(path.join(dir, 'body.html'),   'utf8'),
    });
  }
})();

/**
 * Substitute {{{raw}}} then {{escaped}}. Raw is processed first so a
 * variable name can't accidentally double-substitute.
 */
function substitute(template, ctx, isHtml) {
  return template
    .replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => ctx[k] != null ? String(ctx[k]) : '')
    .replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = ctx[k];
      if (v == null) return '';
      return isHtml ? escapeHtml(v) : String(v);
    });
}

/**
 * Render a template by name with the given context.
 * Returns { subject, text, html }.
 */
function renderTemplate(name, ctx) {
  const tpl = cache.get(name);
  if (!tpl) throw new Error(`Email template not found: ${name}`);
  return {
    subject: substitute(tpl.subject, ctx, false),
    text:    substitute(tpl.text,    ctx, false),
    html:    substitute(tpl.html,    ctx, true),
  };
}

module.exports = { renderTemplate };
