import { test, expect } from '@playwright/test';

/**
 * Visual regression for the Astro build.
 * Same routes + viewports as the CRA suite, comparing against the
 * shared baselines in e2e/visual-regression.spec.ts-snapshots/.
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
  { path: '/impressum', name: 'impressum' },
  { path: '/agb', name: 'agb' },
  { path: '/datenschutzerklaerung', name: 'datenschutzerklaerung' },
];

async function waitForPageStable(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.evaluate(() => document.fonts.ready);
}

for (const route of routes) {
  test(`${route.name} - visual regression`, async ({ page }) => {
    await page.goto(route.path);
    await waitForPageStable(page);
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 6100,
    });
  });
}
