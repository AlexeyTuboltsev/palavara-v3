// @ts-nocheck
export const config = {
  sentry: process.env.REACT_APP_SENTRY,
  imgPrefix: process.env.REACT_APP_IMG_PREFIX,
  lqipPrefix: 'lqip',
  mobileBreakpoint: 600,
  visualTestMode: process.env.REACT_APP_VISUAL_TEST_MODE === 'true'
}
