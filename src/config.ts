// @ts-nocheck

// Determine manifest URL based on environment
// In development: use local /public folder to avoid CORS issues
// In production: use CDN
const getManifestUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return '/img/image-manifest.json';
  }
  return `${process.env.REACT_APP_IMG_PREFIX}/image-manifest.json`;
};

export const config = {
  sentry: process.env.REACT_APP_SENTRY,
  imgPrefix: process.env.REACT_APP_IMG_PREFIX,
  mobileBreakpoint: 600,
  visualTestMode: process.env.REACT_APP_VISUAL_TEST_MODE === 'true',
  useOptimizedImages: process.env.REACT_APP_USE_OPTIMIZED_IMAGES === 'true',
  manifestUrl: getManifestUrl()
}
