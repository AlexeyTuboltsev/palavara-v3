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
 * Get all format URLs for <picture> element
 *
 * @param filename - Image filename
 * @param manifest - Image manifest
 * @returns Object with URLs for each format
 */
export function getImageSources(
  filename: string,
  manifest: TImageManifest | null
): { avif: string; webp: string; jpeg: string; lqip: string } | null {
  if (!manifest) return null;

  const entry = manifest.images[filename];
  if (!entry) return null;

  const imgPrefix = process.env.NODE_ENV === 'development' ? '/img' : config.imgPrefix;

  return {
    avif: `${imgPrefix}/${entry.optimized.avif.path}`,
    webp: `${imgPrefix}/${entry.optimized.webp.path}`,
    jpeg: `${imgPrefix}/${entry.optimized.jpeg.path}`,
    lqip: entry.lqip.base64
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
