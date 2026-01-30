/**
 * Helper to create image-related state fields for route initialization
 *
 * @param filename - Image filename (e.g., "home-1.jpg")
 * @param totalImages - Total number of images in the array (for showing/hiding nav buttons)
 * @returns State fields for initial image
 */
export function createImageState(filename: string, totalImages: number) {
  return {
    currentImage: filename,
    imageLoaded: false,
    totalImages
  };
}
