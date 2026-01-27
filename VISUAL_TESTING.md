# Visual Regression Testing - Quick Start

Complete visual regression testing setup for Palavara Studio using Playwright.

## Quick Commands

```bash
# Run all visual tests
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual

# Update baseline screenshots (after intentional UI changes)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:update

# Open interactive UI mode for debugging
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:ui

# View HTML report after test run
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:report
```

## What Gets Tested

All 13 routes at 3 viewport sizes:
- **Desktop:** 1920x1080 (Chromium)
- **Tablet:** 1024x768 (iPad Pro)
- **Mobile:** 390x844 (iPhone 12)

**Total:** 39+ screenshots per test run

## First Time Setup

Already done! But if you need to reinstall Playwright browsers:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn playwright install chromium
```

## Typical Workflow

### 1. Before Making UI Changes

Run tests to ensure current state passes:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual
```

### 2. Make Your UI Changes

Edit components, styles, etc.

### 3. Run Tests Again

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual
```

Tests will fail showing visual differences.

### 4. Review Differences

Open the HTML report to see visual diffs:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:report
```

Or use UI mode for interactive review:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:ui
```

### 5. Accept Changes (if intentional)

Update baseline screenshots:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:update
```

### 6. Commit Updated Baselines

```bash
git add e2e/**/*-snapshots/
git commit -m "Update visual test baselines after UI changes"
```

## CI/CD Integration

Visual tests run automatically on every push via GitHub Actions.

**Workflow:** `.github/workflows/visual-tests.yml`

### When Tests Fail in CI

1. Navigate to the failed GitHub Actions run
2. Download artifacts:
   - `playwright-report` - Full HTML report
   - `visual-diff-images` - Just the diff images
3. Review the differences
4. If changes are intentional:
   - Pull branch locally
   - Run `yarn test:visual:update`
   - Commit and push updated baselines

## File Structure

```
palavara-v3/
├── e2e/
│   ├── README.md                     # Detailed documentation
│   ├── visual-regression.spec.ts     # Test suite
│   └── visual-regression.spec.ts-snapshots/  # Baseline screenshots (in git)
│       ├── chromium-desktop/
│       ├── chromium-tablet/
│       └── chromium-mobile/
├── playwright.config.ts              # Playwright configuration
├── .github/workflows/
│   └── visual-tests.yml              # CI workflow
└── VISUAL_TESTING.md                 # This file
```

## Troubleshooting

### Tests fail with "Address already in use"

Another dev server is running on port 3000. Stop it and try again.

### Tests are flaky (random failures)

Adjust wait times in `e2e/visual-regression.spec.ts` or increase `maxDiffPixels` threshold.

### Need to test a specific route only

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn playwright test --grep "home"
```

### Need to test only mobile viewport

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn playwright test --project=chromium-mobile
```

## More Details

See comprehensive documentation in `e2e/README.md`.
