#!/usr/bin/env node
/**
 * Full-body prerender for SEO.
 *
 * Supersedes scripts/generate-route-html.js for the BODY content
 * (generate-route-html.js still emits route-specific meta tags as a
 * fallback for any route Playwright fails to render). Without full body
 * content, Googlebot's first-pass crawler sees an empty <div id="root">
 * and queues the URL for JS render — which on a low-authority site is
 * rationed, leading to inconsistent indexing across routes.
 *
 * Walks each of the 32 routes (16 EN + 16 DE) through a headless
 * Chromium against an in-process static server, captures the
 * post-hydration HTML, and overwrites build/<slug>.html (EN) or
 * build/de/<slug>.html (DE). The meta-only HTML produced earlier in
 * the deploy pipeline stays in place as a per-route fallback if a
 * Playwright render fails.
 *
 * Hydration note: src/index.tsx uses ReactDOM.createRoot().render() (NOT
 * hydrateRoot), so a real user loading a prerendered page sees the
 * prerendered content paint first, then React wipes + re-renders once
 * main.js boots. Brief flash on cold loads; SEO win outweighs it.
 * Switching to hydrateRoot is a follow-up.
 *
 * The route list mirrors e2e/visual-regression.spec.ts and the ROUTES
 * array in scripts/generate-route-html.js — kept in sync manually.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('@playwright/test');

const PORT = 5173;
const BUILD_DIR = path.join(__dirname, '..', 'build');

const EN_ROUTES = [
  '/',
  '/kids-class',
  '/wheel-throwing',
  '/family-saturday',
  '/open-studio',
  '/firing-service',
  '/gift-certificate',
  '/team-events',
  '/birthday-parties',
  '/membership',
  '/about-me',
  '/rent-a-space',
  '/contact',
  '/impressum',
  '/agb',
  '/datenschutzerklaerung',
];

// Each EN route gets a DE twin under /de/. Home is `/de` (no trailing
// slash) for symmetry with the routerUtils.applyLangToPath behaviour.
const ROUTES = [
  ...EN_ROUTES,
  ...EN_ROUTES.map(p => (p === '/' ? '/de' : '/de' + p)),
];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

/**
 * Minimal SPA-fallback static file server. Anything missing returns
 * build/index.html so React Router can resolve the route client-side.
 */
function createServer() {
  return http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = path.join(BUILD_DIR, url);

    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', CONTENT_TYPES[ext] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      // SPA fallback. Read fresh each time so prerender output for
      // earlier routes doesn't leak into later renders.
      fs.readFile(path.join(BUILD_DIR, 'index.html'), (err2, data) => {
        if (err2) {
          res.statusCode = 500;
          res.end('500: index.html missing — run yarn build first');
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(data);
      });
    });
  });
}

/**
 * Wait for the app to settle. The studio's init saga walks through
 * NOT_STARTED → IN_PROGRESS → READY; only after READY do route
 * components mount their real content. We can't introspect Redux from
 * outside, but we can wait for a stable indicator: the root div has
 * non-trivial children AND networkidle has held for a moment.
 */
async function waitForReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    if (!root || root.children.length === 0) return false;
    // Avoid capturing during the initial empty IN_PROGRESS render.
    // Real content has at least a few hundred characters of text.
    return (root.textContent || '').trim().length > 100;
  }, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  // Final small wait for any post-render paint stability (footer
  // animations, lazy chunk imports).
  await page.waitForTimeout(300);
}

// Output path: build/index.html or build/<slug>.html for EN, and
// build/de/index.html or build/de/<slug>.html for DE.
function outputPathFor(route) {
  if (route === '/') return path.join(BUILD_DIR, 'index.html');
  if (route === '/de') return path.join(BUILD_DIR, 'de', 'index.html');
  const slug = route.replace(/^\//, '');
  return path.join(BUILD_DIR, `${slug}.html`);
}

async function main() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.error(`ERROR: ${BUILD_DIR}/index.html not found. Run yarn build first.`);
    process.exit(1);
  }

  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`✓ serving build/ on ${baseUrl}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (const route of ROUTES) {
    const page = await context.newPage();
    try {
      const url = `${baseUrl}${route}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForReady(page);

      const html = await page.content();
      // Sanity check: if the captured body is still under ~2 KB, we
      // caught it before the app rendered. Skip the write so the
      // meta-only fallback from generate-route-html.js stays in place.
      if (html.length < 2000) {
        throw new Error(`captured HTML too small (${html.length} bytes) — render likely incomplete`);
      }

      const outPath = outputPathFor(route);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`✓ ${route.padEnd(36)} → ${(html.length / 1024).toFixed(1)} KB`);
      successCount++;
    } catch (e) {
      console.warn(`✗ ${route}: ${e.message}`);
      failCount++;
      failures.push({ route, error: e.message });
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  console.log(`\nprerendered ${successCount}/${ROUTES.length} routes (${failCount} failed)`);

  if (successCount === 0) {
    console.error('All routes failed to render — aborting deploy.');
    process.exit(1);
  }

  if (failCount > 0) {
    console.warn('Partial failure — falling back to existing per-route HTML for failed routes.');
    for (const f of failures) {
      console.warn(`  ${f.route}: ${f.error}`);
    }
  }
}

main().catch((err) => {
  console.error('prerender crashed:', err);
  process.exit(1);
});
