#!/usr/bin/env node
/**
 * Full-body prerender for SEO.
 *
 * Supersedes scripts/generate-route-html.js. That script wrote per-route
 * HTML with route-specific <title>/meta/canonical/og tags but left the
 * body as the empty SPA shell ("You need to enable JavaScript to run
 * this app."). Googlebot's first-pass crawler sees that empty body and
 * has to add the URL to a JS render queue — which on a low-authority
 * site means probabilistic render budget: some routes get rendered and
 * indexed, others get skipped or judged as soft 404. We saw exactly
 * that pattern: 11 of 16 routes indexed, /wheel-throwing rejected as
 * "validation failed".
 *
 * This script renders the full React app for each route through a
 * headless Chromium, then writes the post-hydration HTML — so the
 * first-pass crawler sees real body content immediately, no JS render
 * queue dependency.
 *
 * Hydration note: src/index.tsx uses ReactDOM.createRoot().render() (NOT
 * hydrateRoot), so a real user loading a prerendered page will see the
 * prerendered content paint first, then React will wipe + re-render
 * once main.js finishes booting. Brief flash on cold loads; the SEO
 * win outweighs it. Switching to hydrateRoot is a follow-up.
 *
 * The list of routes mirrors e2e/visual-regression.spec.ts and
 * scripts/generate-route-html.js — kept in sync manually.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('@playwright/test');

const PORT = 5173;
const BUILD_DIR = path.join(__dirname, '..', 'build');

// Routes that match src/router.ts. Home is `/` — its output overwrites
// build/index.html. Other routes write to build/<slug>.html.
const ROUTES = [
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
    let filePath = path.join(BUILD_DIR, url);

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

function outputPathFor(route) {
  if (route === '/') return path.join(BUILD_DIR, 'index.html');
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
    // Disable JS animations during capture so the post-render DOM is
    // stable. Keeping this simple — we don't need the same prefers-
    // reduced-motion plumbing the visual tests have.
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
      // Sanity check: if the captured body is still under ~500 chars,
      // we caught it before the app rendered. Skip the write so the
      // meta-only fallback from generate-route-html.js (if it ran)
      // stays in place.
      if (html.length < 2000) {
        throw new Error(`captured HTML too small (${html.length} bytes) — render likely incomplete`);
      }

      fs.writeFileSync(outputPathFor(route), html);
      console.log(`✓ ${route.padEnd(28)} → ${(html.length / 1024).toFixed(1)} KB`);
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
    // Non-zero exit on partial failure would block the deploy. We
    // prefer "ship the routes that did render" over "ship nothing":
    // even one prerendered route is better than zero, and the failed
    // ones fall back to the meta-only HTML that was already written.
  }
}

main().catch((err) => {
  console.error('prerender crashed:', err);
  process.exit(1);
});
