import {config} from "../../config";

/**
 * Helper to create image-related state fields for route initialization
 *
 * When optimized images are enabled:
 *   - Returns { currentImage: filename, imageLoaded: false }
 * When optimized images are disabled:
 *   - Returns { imageUrl: fullUrl, imageLqipUrl: fullLqipUrl }
 *
 * @param filename - Image filename (e.g., "home-1.jpg")
 * @returns State fields for initial image
 */
export function createImageState(filename: string) {
  if (config.useOptimizedImages) {
    return {
      currentImage: filename,
      imageLoaded: false
    };
  } else {
    return {
      imageUrl: `${config.imgPrefix}/${filename}`,
      imageLqipUrl: `${config.imgPrefix}/${config.lqipPrefix}/${filename}`
    };
  }
}
