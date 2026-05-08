/**
 * i18n bootstrap for the booking page.
 *
 * Initialises i18next with the browser-language detector and the
 * http-backend (loads `locales/<lng>/translation.json` on demand), then
 * walks the document and fills in every `data-i18n="key"` element.
 *
 * Locale detection precedence:
 *   1. `?lang=…` query string  (deep links / language switcher)
 *   2. `localStorage.i18nextLng`
 *   3. `<html lang>` attribute
 *   4. `navigator.language`
 *   5. fallback `en`
 *
 * App scripts (app.js, confirm.js, cancel.js) expose a global `boot()`
 * function that this module calls **after** i18next is ready, so
 * t(`form.name.label`) etc. work synchronously inside event handlers.
 *
 * `data-i18n` syntax (matches the i18next convention):
 *   <span data-i18n="form.name.label">…</span>
 *     → element.textContent = t('form.name.label')
 *   <input data-i18n="[placeholder]form.name.placeholder">
 *     → element.placeholder    = t('form.name.placeholder')
 *   <button data-i18n="[aria-label]common.close;common.close">
 *     → element.aria-label     = t('common.close')
 *     → element.textContent    = t('common.close')
 *   Multiple specs separated by `;`.
 */

'use strict';

(function () {
  // The page MUST list these scripts before i18n.js:
  //   <script src="vendor/i18next.min.js"></script>
  //   <script src="vendor/i18nextBrowserLanguageDetector.min.js"></script>
  //   <script src="vendor/i18nextHttpBackend.min.js"></script>
  // i18next exposes itself as a global; the plugins as i18nextBrowserLanguageDetector / i18nextHttpBackend.

  i18next
    .use(i18nextBrowserLanguageDetector)
    .use(i18nextHttpBackend)
    .init(
      {
        fallbackLng: 'en',
        supportedLngs: ['en'],
        // load: 'languageOnly' — collapse "en-GB", "en-US" etc. to "en".
        load: 'languageOnly',
        backend: {
          loadPath: 'locales/{{lng}}/{{ns}}.json',
        },
        detection: {
          order: ['querystring', 'localStorage', 'htmlTag', 'navigator'],
          lookupQuerystring: 'lang',
          caches: ['localStorage'],
        },
        // Our keys come from our own JSON; no user input is rendered as
        // HTML, so escaping is unnecessary noise.
        interpolation: { escapeValue: false },
      },
      function (err) {
        if (err) {
          // Fail open — the static text in the HTML is the English source,
          // so an i18n init failure leaves the page perfectly usable. Log
          // and continue.
          console.warn('i18next init failed:', err);
        }
        document.documentElement.lang = i18next.resolvedLanguage || 'en';
        applyI18n(document);

        // Hand off to the page-specific app code.
        if (typeof window.boot === 'function') {
          try {
            window.boot();
          } catch (e) {
            console.error('boot() threw:', e);
          }
        }
      }
    );

  /** Walk the DOM under `root` and apply every `data-i18n` directive. */
  function applyI18n(root) {
    const els = root.querySelectorAll('[data-i18n]');
    for (let i = 0; i < els.length; i++) {
      applyOne(els[i]);
    }
  }

  function applyOne(el) {
    const spec = el.getAttribute('data-i18n');
    if (!spec) return;
    const parts = spec.split(';');
    for (const raw of parts) {
      const part = raw.trim();
      if (!part) continue;
      const m = part.match(/^\[([^\]]+)\](.+)$/);
      if (m) {
        el.setAttribute(m[1], i18next.t(m[2]));
      } else {
        el.textContent = i18next.t(part);
      }
    }
  }

  // Re-export for app code that injects nodes after init.
  window.applyI18n = applyI18n;
})();
