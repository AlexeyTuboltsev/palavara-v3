import { test, expect } from '@playwright/test';

/**
 * Visual Regression Test Suite for Palavara Studio
 *
 * Tests all routes with screenshot comparison to detect visual regressions.
 * Runs on desktop, tablet, and mobile viewports (configured in playwright.config.ts).
 *
 * Local usage:
 *   yarn test:visual          - Run all visual tests
 *   yarn test:visual:update   - Update baseline screenshots
 *   yarn test:visual:ui       - Open Playwright UI mode
 *
 * CI: Automatically runs on every push via GitHub Actions
 */

/**
 * Route definitions matching src/router.ts
 */
const routes = [
  { path: '/', name: 'home' },
  { path: '/kids-class', name: 'kids-class' },
  { path: '/wheel-throwing', name: 'wheel-throwing' },
  { path: '/family-saturday', name: 'family-saturday' },
  { path: '/open-studio', name: 'open-studio' },
  { path: '/firing-service', name: 'firing-service' },
  { path: '/gift-certificate', name: 'gift-certificate' },
  { path: '/team-events', name: 'team-events' },
  { path: '/birthday-parties', name: 'birthday-parties' },
  { path: '/membership', name: 'membership' },
  { path: '/about-me', name: 'about-me' },
  { path: '/rent-a-space', name: 'rent-a-space' },
  { path: '/contact', name: 'contact' },
];

/**
 * Helper to wait for page to be fully loaded and stable
 */
async function waitForPageStable(page: any) {
  // Wait for network to be idle (no pending requests)
  await page.waitForLoadState('networkidle');

  // Wait for any animations to complete
  await page.waitForTimeout(500);

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
}

// Test each route
for (const route of routes) {
  test(`${route.name} - visual regression`, async ({ page }) => {
    // Navigate to the route
    await page.goto(route.path);

    // Wait for page to be fully loaded and stable
    await waitForPageStable(page);

    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      // Allow small differences due to font rendering and anti-aliasing
      // Images are replaced with gray placeholders in test mode to avoid randomization issues
      maxDiffPixels: 6100,
    });
  });
}

