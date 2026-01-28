/**
 * Browser format detection utilities
 *
 * Detects support for modern image formats (AVIF, WebP)
 * Results are cached for performance
 */

let avifSupport: boolean | null = null;
let webpSupport: boolean | null = null;

/**
 * Detect AVIF format support
 *
 * Uses a tiny 1x1 AVIF image to test browser support
 * Result is cached after first check
 */
export async function detectAvifSupport(): Promise<boolean> {
  if (avifSupport !== null) {
    return avifSupport;
  }

  // Tiny 1x1 AVIF test image
  const testImage = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      avifSupport = true;
      resolve(true);
    };
    img.onerror = () => {
      avifSupport = false;
      resolve(false);
    };
    img.src = testImage;
  });
}

/**
 * Detect WebP format support
 *
 * Uses a tiny 1x1 WebP image to test browser support
 * Result is cached after first check
 */
export async function detectWebpSupport(): Promise<boolean> {
  if (webpSupport !== null) {
    return webpSupport;
  }

  // Tiny 1x1 WebP test image
  const testImage = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webpSupport = true;
      resolve(true);
    };
    img.onerror = () => {
      webpSupport = false;
      resolve(false);
    };
    img.src = testImage;
  });
}

/**
 * Get the best supported format for the current browser
 *
 * Priority: AVIF > WebP > JPEG
 */
export async function getBestSupportedFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  if (await detectAvifSupport()) {
    return 'avif';
  }
  if (await detectWebpSupport()) {
    return 'webp';
  }
  return 'jpeg';
}
