import { SITE } from './site';

interface ManifestEntry {
  optimized: {
    avif: { path: string };
    webp: { path: string };
    jpeg: { path: string };
  };
  lqip: { base64: string; path: string };
}

interface ImageManifest {
  images: Record<string, ManifestEntry>;
}

let manifestPromise: Promise<ImageManifest | null> | null = null;

async function loadManifest(): Promise<ImageManifest | null> {
  try {
    const url = `${SITE.imgPrefix}/image-manifest.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'palavara-astro-build', Accept: 'application/json' },
    });
    if (!res.ok) {
      console.warn(`[imageManifest] fetch ${res.status} from ${url}`);
      return null;
    }
    return (await res.json()) as ImageManifest;
  } catch (err) {
    console.warn('[imageManifest] fetch failed', err);
    return null;
  }
}

export function getManifest(): Promise<ImageManifest | null> {
  if (!manifestPromise) manifestPromise = loadManifest();
  return manifestPromise;
}

export async function getLqip(base: string): Promise<string | null> {
  const m = await getManifest();
  return m?.images[`${base}.jpg`]?.lqip.base64 ?? null;
}
