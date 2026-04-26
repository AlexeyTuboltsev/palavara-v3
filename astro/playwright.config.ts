import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Visual regression for the Astro build.
 *
 * Reuses the baseline screenshots from the CRA test suite
 * (e2e/visual-regression.spec.ts-snapshots/) so we can verify the Astro
 * pages render visually identical to the production CRA build.
 *
 * Astro images are replaced with gray placeholders when
 * PUBLIC_VISUAL_TEST_MODE=true is set at build time.
 */
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Re-use baselines from the CRA suite. Files are named like
  // "home-chromium-desktop-linux.png".
  snapshotPathTemplate: path.join(
    repoRoot,
    'e2e/visual-regression.spec.ts-snapshots/{arg}-{projectName}-{platform}{ext}'
  ),

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['iPad Pro'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'yarn build:test && yarn preview --host 127.0.0.1 --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
