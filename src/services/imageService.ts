/**
 * Image service for optimized image selection
 *
 * Selects the best image format based on browser support:
 * - AVIF (best compression, 70-80% savings)
 * - WebP (good compression, 60-70% savings)
 * - JPEG (baseline fallback)
 */

import { TImageManifest, TOptimizedImageResult } from '../types/imageManifest';
import { config } from '../config';

export interface TImageSource {
  // Selected image URL based on browser support
  src: string;

  // LQIP as base64 data URL (instant display)
  lqipBase64: string;
}

/**
 * Select best image source based on browser support
 *
 * @param filename - Image filename (e.g., "home-1.jpg")
 * @param manifest - Image manifest
 * @returns Image source URL or null if not found
 */
export function selectImageSource(
  filename: string,
  manifest: TImageManifest | null
): TImageSource | null {
  if (!manifest) {
    console.error('Image manifest not loaded');
    return null;
  }

  const entry: TOptimizedImageResult | undefined = manifest.images[filename];

  if (!entry) {
    console.error(`Image not found in manifest: ${filename}`);
    return null;
  }

  // Use local paths in development, CDN in production
  const imgPrefix = process.env.NODE_ENV === 'development' ? '/img' : config.imgPrefix;

  // Select best format based on browser support
  // Browser will automatically choose the best format via <picture> element
  // For now, default to AVIF (most modern browsers support it)
  const selectedPath = entry.optimized.avif.path;

  return {
    src: `${imgPrefix}/${selectedPath}`,
    lqipBase64: entry.lqip.base64
  };
}

/**
 * Bases for which scripts/generate-hero-variants.js produced 640w + 1280w
 * variants alongside the 1920w original. Keep in sync with that script.
 */
const RESPONSIVE_HERO_BASES = new Set<string>([
  'home-1', 'home-2', 'home-3', 'home-4', 'home-5', 'home-6', 'home-7',
  '01-01', '02-01', '04-01', '05-01', '05-02', '06-01', '07-01', '08-01', '09-01', '10-01',
  '2025-10-24-155119_002',
]);

function stripExt(filename: string): string {
  return filename.replace(/\.(jpg|jpeg|webp|avif)$/i, '');
}

/**
 * Get all format URLs for <picture> element
 *
 * @param filename - Image filename
 * @param manifest - Image manifest
 * @returns Object with URLs for each format and (when responsive variants
 *          exist for this base) srcset strings for use with sizes=.
 */
export function getImageSources(
  filename: string,
  manifest: TImageManifest | null
): {
  avif: string; webp: string; jpeg: string; lqip: string;
  avifSrcSet?: string; webpSrcSet?: string; jpegSrcSet?: string;
} | null {
  if (!manifest) return null;

  const entry = manifest.images[filename];
  if (!entry) return null;

  const imgPrefix = process.env.NODE_ENV === 'development' ? '/img' : config.imgPrefix;
  const avif = `${imgPrefix}/${entry.optimized.avif.path}`;
  const webp = `${imgPrefix}/${entry.optimized.webp.path}`;
  const jpeg = `${imgPrefix}/${entry.optimized.jpeg.path}`;

  const base = stripExt(filename);
  if (!RESPONSIVE_HERO_BASES.has(base)) {
    return { avif, webp, jpeg, lqip: entry.lqip.base64 };
  }

  const variant = (ext: 'avif' | 'webp' | 'jpg') =>
    `${imgPrefix}/${base}-640.${ext} 640w, ${imgPrefix}/${base}-768.${ext} 768w, ${imgPrefix}/${base}-1024.${ext} 1024w, ${imgPrefix}/${base}-1280.${ext} 1280w, ${imgPrefix}/${base}.${ext} 1920w`;

  return {
    avif, webp, jpeg,
    avifSrcSet: variant('avif'),
    webpSrcSet: variant('webp'),
    jpegSrcSet: variant('jpg'),
    lqip: entry.lqip.base64,
  };
}

/**
 * Get LQIP only (useful for immediate display before loading manifest)
 *
 * @param filename - Image filename
 * @param manifest - Image manifest
 * @returns LQIP base64 data URL or null
 */
export function getLqip(filename: string, manifest: TImageManifest | null): string | null {
  if (!manifest) return null;
  const entry = manifest.images[filename];
  return entry ? entry.lqip.base64 : null;
}

/**
 * Check if image exists in manifest
 */
export function hasImage(filename: string, manifest: TImageManifest | null): boolean {
  if (!manifest) return false;
  return filename in manifest.images;
}
