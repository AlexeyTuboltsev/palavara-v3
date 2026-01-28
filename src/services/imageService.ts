/**
 * Image service for optimized image selection
 *
 * Selects the best image format and size based on:
 * - Browser support (AVIF > WebP > JPEG)
 * - Screen size (desktop/tablet/mobile)
 * - Image manifest data
 */

import { EScreenSize } from '../routes/common/screenSize';
import { TImageManifest, TOptimizedImageResult } from '../types/imageManifest';
import { config } from '../config';

export interface TImageSource {
  // Full-size image URLs for each format
  srcJpeg: string;
  srcWebp: string;
  srcAvif: string;

  // Responsive variant URLs (size-optimized)
  responsiveJpeg: string;
  responsiveWebp: string;
  responsiveAvif: string;

  // LQIP as base64 data URL (instant display)
  lqipBase64: string;
}

/**
 * Select image source based on screen size
 *
 * @param filename - Image filename (e.g., "home-1.jpg")
 * @param screenSize - Current screen size
 * @param manifest - Image manifest
 * @returns Image source URLs or null if not found
 */
export function selectImageSource(
  filename: string,
  screenSize: EScreenSize,
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

  const imgPrefix = config.imgPrefix;

  // Select responsive size based on screen
  const responsiveSize =
    screenSize === EScreenSize.DESKTOP ? '1920w' : '640w';

  const responsiveVariant = entry.responsive[responsiveSize];

  if (!responsiveVariant) {
    console.error(`Responsive variant not found for ${filename} at ${responsiveSize}`);
    return null;
  }

  return {
    // Full-size optimized images
    srcJpeg: `${imgPrefix}/${entry.optimized.jpeg.path}`,
    srcWebp: `${imgPrefix}/${entry.optimized.webp.path}`,
    srcAvif: `${imgPrefix}/${entry.optimized.avif.path}`,

    // Responsive variants (size-optimized for current screen)
    responsiveJpeg: `${imgPrefix}/${responsiveVariant.jpeg.path}`,
    responsiveWebp: `${imgPrefix}/${responsiveVariant.webp.path}`,
    responsiveAvif: `${imgPrefix}/${responsiveVariant.avif.path}`,

    // LQIP (instant display, no fetch needed)
    lqipBase64: entry.lqip.base64
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
