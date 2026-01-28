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
  const result = config.useOptimizedImages ? {
    currentImage: filename,
    imageLoaded: false
  } : {
    imageUrl: `${config.imgPrefix}/${filename}`,
    imageLqipUrl: `${config.imgPrefix}/${config.lqipPrefix}/${filename}`
  };

  console.log('createImageState:', {
    filename,
    useOptimizedImages: config.useOptimizedImages,
    result
  });

  return result;
}
