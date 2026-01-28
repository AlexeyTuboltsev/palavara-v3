/**
 * Helper to create image-related state fields for route initialization
 *
 * @param filename - Image filename (e.g., "home-1.jpg")
 * @returns State fields for initial image
 */
export function createImageState(filename: string) {
  return {
    currentImage: filename,
    imageLoaded: false
  };
}
