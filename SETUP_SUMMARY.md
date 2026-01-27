# Visual Regression Testing Setup - Complete

## What Was Installed

### Dependencies
- `@playwright/test` - Visual regression testing framework
- Chromium browser for Playwright

### New Files Created

1. **Configuration**
   - `playwright.config.ts` - Playwright configuration with 3 viewports
   - `.github/workflows/visual-tests.yml` - GitHub Actions CI workflow

2. **Test Suite**
   - `e2e/visual-regression.spec.ts` - Test suite for all 13 routes
   - `e2e/README.md` - Detailed testing documentation
   - `e2e/visual-regression.spec.ts-snapshots/` - 39 baseline screenshots (committed to git)

3. **Documentation**
   - `VISUAL_TESTING.md` - Quick start guide
   - `SETUP_SUMMARY.md` - This file

4. **Package Scripts** (added to package.json)
   - `yarn test:visual` - Run visual tests
   - `yarn test:visual:update` - Update baseline screenshots
   - `yarn test:visual:ui` - Open Playwright UI mode
   - `yarn test:visual:report` - View HTML test report

5. **Modified Files**
   - `.gitignore` - Added Playwright temp directories
   - `package.json` - Added test scripts
   - `yarn.lock` - Updated with Playwright dependency

## Test Coverage

### Routes Tested (13 total)
All routes from `src/router.ts`:
- Home (`/`)
- Kids Class (`/kids-class`)
- Wheel Throwing (`/wheel-throwing`)
- Family Saturday (`/family-saturday`)
- Open Studio (`/open-studio`)
- Firing Service (`/firing-service`)
- Gift Certificate (`/gift-certificate`)
- Team Events (`/team-events`)
- Birthday Parties (`/birthday-parties`)
- Membership (`/membership`)
- About Me (`/about-me`)
- Rent a Space (`/rent-a-space`)
- Contact (`/contact`)

### Viewports Tested (3 total)
- **Desktop:** 1920x1080 (Chromium)
- **Tablet:** 1024x768 (iPad Pro)
- **Mobile:** 390x844 (iPhone 12)

### Additional Tests
- Contact form focus states
- Mobile menu open state

**Total: 43 tests** (39 route screenshots + 4 interactive state tests)

## How It Works

### Local Development
1. Tests automatically start dev server on localhost:3000
2. Navigate to each route and wait for page to be stable
3. Capture full-page screenshots
4. Compare with baseline images (pixel-by-pixel)
5. Tests fail if differences exceed 100 pixels threshold
6. Generate HTML report with visual diffs

### CI/CD (GitHub Actions)
1. Triggered on every push to main/master and on pull requests
2. Installs dependencies and Playwright browsers
3. Runs all visual tests
4. Uploads test reports and diff images as artifacts (retained for 30 days)
5. Tests must pass before merge

## Quick Start

### Running Tests Locally

```bash
# Run all visual tests (compares against baselines)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual

# Update baselines after UI changes
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:update

# Debug tests interactively
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:ui
```

### Typical Workflow

1. Make UI changes
2. Run `yarn test:visual` to see differences
3. Review diffs in HTML report (`yarn test:visual:report`)
4. If changes are intentional, update baselines (`yarn test:visual:update`)
5. Commit updated baseline screenshots

## CI Integration

Tests run automatically on:
- Every push to main/master
- Every pull request

If tests fail:
1. Check GitHub Actions run
2. Download `playwright-report` artifact
3. Review visual differences
4. If intentional, update baselines locally and push

## File Size

Total baseline screenshots: ~16MB
- Desktop: ~11MB (13 routes)
- Tablet: ~5MB (13 routes)
- Mobile: ~1MB (13 routes)

These are committed to git for version control of visual states.

## Next Steps

The visual testing suite is now fully operational and ready to use!

1. The baseline screenshots represent your current UI state
2. Any visual changes will be caught automatically
3. Run tests locally before pushing to catch regressions early
4. CI will verify visual consistency on every push

## Resources

- **Quick Reference:** `VISUAL_TESTING.md`
- **Detailed Docs:** `e2e/README.md`
- **Config:** `playwright.config.ts`
- **Tests:** `e2e/visual-regression.spec.ts`
- **CI Workflow:** `.github/workflows/visual-tests.yml`

---

Setup completed on: 2026-01-27
Test Status: ✅ All 43 tests passing
