# Visual Regression Testing

Automated visual regression tests for Palavara Studio using Playwright.

## Overview

This test suite captures screenshots of all routes at multiple viewport sizes (desktop, tablet, mobile) and compares them against baseline images to detect visual regressions.

## Local Development

### Prerequisites

Install Playwright browsers (one-time setup):

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn playwright install chromium
```

### Running Tests

```bash
# Run all visual tests
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual

# Run tests in UI mode (interactive debugging)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:ui

# View HTML test report
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:report
```

### Updating Baseline Screenshots

When you intentionally change the UI, update the baseline screenshots:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:update
```

This will regenerate all baseline screenshots in `e2e/**/*-snapshots/`.

**Important:** Review the changes carefully before committing updated baselines to git.

### Running Specific Tests

```bash
# Run only tests matching a pattern
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn playwright test --grep "home"

# Run only on specific viewport
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn playwright test --project=chromium-desktop
```

## CI/CD Integration

Visual tests run automatically on every push via GitHub Actions (`.github/workflows/visual-tests.yml`).

### When Tests Fail in CI

1. Go to GitHub Actions → Failed workflow run
2. Download artifacts:
   - `playwright-report` - Full HTML report with visual diffs
   - `visual-diff-images` - Just the diff/actual images
3. Review the differences:
   - `*-actual.png` - What was rendered
   - `*-expected.png` - The baseline
   - `*-diff.png` - Highlighted differences

### Accepting Changes in CI

If the visual changes are intentional:

1. Pull the branch locally
2. Run `yarn test:visual:update` to regenerate baselines
3. Commit and push the updated snapshots

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Viewports:** Desktop (1920x1080), Tablet (1024x768), Mobile (390x844)
- **Browser:** Chromium only (can add Firefox/WebKit if needed)
- **Threshold:** Max 100 pixels difference allowed (for anti-aliasing)
- **Timeout:** 30 seconds per test

## Test Coverage

All routes from `src/router.ts` are tested:

- `/` (home)
- `/kids-class`
- `/wheel-throwing`
- `/family-saturday`
- `/open-studio`
- `/firing-service`
- `/gift-certificate`
- `/team-events`
- `/birthday-parties`
- `/membership`
- `/about-me`
- `/rent-a-space`
- `/contact`

Additional tests cover:
- Mobile menu open state
- Form focus states
- Responsive menu layout

## Troubleshooting

### Tests are flaky

If tests fail randomly due to animations or loading states:

1. Increase `waitForTimeout` in `e2e/visual-regression.spec.ts`
2. Add custom wait conditions for specific dynamic content
3. Adjust `maxDiffPixels` threshold if needed

### Fonts look different locally vs CI

Ensure font files are loaded properly. The test waits for `document.fonts.ready`, but some custom fonts may need additional handling.

### Images not loading

Check that image URLs are accessible during tests. You may need to:
- Mock external image APIs
- Use local image fixtures
- Increase network timeout

## Adding New Tests

To add a new route:

1. Add route to the `routes` array in `e2e/visual-regression.spec.ts`
2. Run `yarn test:visual:update` to generate baseline
3. Commit the new baseline screenshot

For new interactive states:

1. Add test in the "Interactive states" describe block
2. Use appropriate selectors for your UI elements
3. Generate baseline and commit

## File Structure

```
e2e/
├── README.md                          # This file
├── visual-regression.spec.ts          # Main test suite
└── visual-regression.spec.ts-snapshots/  # Baseline screenshots (committed to git)
    ├── chromium-desktop/
    ├── chromium-tablet/
    └── chromium-mobile/
```

## Best Practices

1. **Commit baselines to git** - Baseline screenshots are source code
2. **Review diffs carefully** - Don't blindly accept visual changes
3. **Keep tests stable** - Avoid time-dependent or random content in screenshots
4. **Use meaningful names** - Screenshot names should describe what they test
5. **Test critical paths** - Focus on user-facing pages and interactions
