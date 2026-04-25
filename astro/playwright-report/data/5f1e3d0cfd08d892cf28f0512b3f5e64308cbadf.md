# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-regression.spec.ts >> home - visual regression
- Location: e2e/visual-regression.spec.ts:34:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  309600 pixels (ratio 0.15 of all image pixels) are different.

  Snapshot: home.png

Call log:
  - Expect "toHaveScreenshot(home.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 309600 pixels (ratio 0.15 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 309600 pixels (ratio 0.15 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - link "Palavara — home" [ref=e5] [cursor=pointer]:
      - /url: /
      - img [ref=e6]
    - generic [ref=e14]:
      - text: Pottery classes
      - text: for kids and adults
    - generic [ref=e16]:
      - link "palavara_potterystudio" [ref=e17] [cursor=pointer]:
        - /url: https://www.instagram.com/palavara_potterystudio/
      - generic:
        - img
      - link "palavara_ceramics" [ref=e20] [cursor=pointer]:
        - /url: https://www.instagram.com/palavara_ceramics/
    - generic [ref=e21]:
      - generic [ref=e22]: classes
      - link "family saturday" [ref=e23] [cursor=pointer]:
        - /url: /family-saturday
      - link "open studio" [ref=e24] [cursor=pointer]:
        - /url: /open-studio
      - link "firing service" [ref=e25] [cursor=pointer]:
        - /url: /firing-service
      - link "gift certificate" [ref=e26] [cursor=pointer]:
        - /url: /gift-certificate
      - link "membership" [ref=e27] [cursor=pointer]:
        - /url: /membership
      - generic [ref=e28]: event workshops
      - link "Toggle menu":
        - /url: /
  - link "Pottery studio membership available! →" [ref=e31] [cursor=pointer]:
    - /url: /membership
    - text: Pottery studio membership
    - text: available! →
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Visual regression for the Astro build.
  5  |  * Same routes + viewports as the CRA suite, comparing against the
  6  |  * shared baselines in e2e/visual-regression.spec.ts-snapshots/.
  7  |  */
  8  | const routes = [
  9  |   { path: '/', name: 'home' },
  10 |   { path: '/kids-class', name: 'kids-class' },
  11 |   { path: '/wheel-throwing', name: 'wheel-throwing' },
  12 |   { path: '/family-saturday', name: 'family-saturday' },
  13 |   { path: '/open-studio', name: 'open-studio' },
  14 |   { path: '/firing-service', name: 'firing-service' },
  15 |   { path: '/gift-certificate', name: 'gift-certificate' },
  16 |   { path: '/team-events', name: 'team-events' },
  17 |   { path: '/birthday-parties', name: 'birthday-parties' },
  18 |   { path: '/membership', name: 'membership' },
  19 |   { path: '/about-me', name: 'about-me' },
  20 |   { path: '/rent-a-space', name: 'rent-a-space' },
  21 |   { path: '/contact', name: 'contact' },
  22 |   { path: '/impressum', name: 'impressum' },
  23 |   { path: '/agb', name: 'agb' },
  24 |   { path: '/datenschutzerklaerung', name: 'datenschutzerklaerung' },
  25 | ];
  26 | 
  27 | async function waitForPageStable(page: any) {
  28 |   await page.waitForLoadState('networkidle');
  29 |   await page.waitForTimeout(500);
  30 |   await page.evaluate(() => document.fonts.ready);
  31 | }
  32 | 
  33 | for (const route of routes) {
  34 |   test(`${route.name} - visual regression`, async ({ page }) => {
  35 |     await page.goto(route.path);
  36 |     await waitForPageStable(page);
> 37 |     await expect(page).toHaveScreenshot(`${route.name}.png`, {
     |                        ^ Error: expect(page).toHaveScreenshot(expected) failed
  38 |       fullPage: true,
  39 |       animations: 'disabled',
  40 |       maxDiffPixels: 6100,
  41 |     });
  42 |   });
  43 | }
  44 | 
```