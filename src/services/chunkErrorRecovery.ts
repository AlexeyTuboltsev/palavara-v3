/**
 * Recover from "Loading chunk N failed" errors after a deploy.
 *
 * React.lazy() pulls each route's component as a hash-named webpack
 * chunk (e.g. /static/js/393.4058a2f9.chunk.js). After a deploy:
 *   - The CDN/HTML still cached on a user's tab points at the OLD
 *     hashed chunk URLs (HTML cache-control: max-age=300).
 *   - The new build replaces those chunks with new hashed names.
 *   - When the user navigates to a lazy-loaded route, webpack tries
 *     to fetch the old URL → 404 → ChunkLoadError → blank page +
 *     a Sentry error.
 *
 * We separately fixed the deploy script to stop --delete'ing old
 * chunks (so future deploys keep the old chunk files around for a
 * while). This module handles users who hit a stale chunk before
 * that fix is in production: catch the failure, reload the page
 * with a cache buster so the browser fetches the latest HTML and
 * the latest chunk URLs come with it.
 *
 * Guarded against reload loops: at most one reload per minute per
 * tab (sessionStorage). If a chunk is genuinely broken (not a
 * stale-deploy artifact) the second failure surfaces normally.
 */

const RELOAD_TS_KEY = 'palavara_chunk_reload_ts';
const RELOAD_COOLDOWN_MS = 60_000;

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string };
  if (e.name === 'ChunkLoadError') return true;
  const msg = e.message || String(err);
  return /Loading (CSS )?chunk\b/i.test(msg) && /failed/i.test(msg);
}

function isCssLinkFailure(target: EventTarget | null): boolean {
  // CSS chunk loads happen via injected <link rel="stylesheet"> tags;
  // a 404 surfaces as a window 'error' event whose target is the link.
  return (
    target instanceof HTMLLinkElement &&
    target.rel === 'stylesheet' &&
    /\.chunk\.css(\?|$)/.test(target.href)
  );
}

function reloadOnce(reason: string): void {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_TS_KEY) || '0');
    if (Number.isFinite(last) && Date.now() - last < RELOAD_COOLDOWN_MS) {
      // Already tried within the last minute; don't loop.
      return;
    }
    sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now()));
  } catch {
    // sessionStorage can throw in private mode / storage-disabled
    // contexts. Still better to try the reload than to give up.
  }
  // Force-bypass the HTML cache by adding a query param. Plain
  // location.reload() may serve the stale cached HTML which still
  // points at the same broken chunk URLs.
  // eslint-disable-next-line no-console
  console.warn(`[chunk-recovery] reloading after ${reason}`);
  const url = new URL(window.location.href);
  url.searchParams.set('_cr', String(Date.now()));
  window.location.replace(url.toString());
}

export function initChunkErrorRecovery(): void {
  window.addEventListener(
    'error',
    (event) => {
      if (isChunkLoadError(event.error) || isCssLinkFailure(event.target)) {
        reloadOnce('window error');
      }
    },
    // Capture phase: <link>'s 'error' event doesn't bubble.
    true,
  );
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) {
      reloadOnce('unhandledrejection');
    }
  });
}
