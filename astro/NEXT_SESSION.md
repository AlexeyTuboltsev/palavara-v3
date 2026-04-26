# Astro port — plan for next session

Self-contained handoff. Read this top-to-bottom in a fresh session and you have everything needed.

## Goal
The Astro port (`/astro`) must render visually identical to the existing CRA build, validated by the Playwright visual-regression suite using the existing CRA baselines in `e2e/visual-regression.spec.ts-snapshots/`.

**"Done" =** `yarn test:visual` from `astro/` passes all 48 tests (16 routes × 3 viewports) without updating baselines.

## Current state (PR #85, branch `spike-astro-home`)

**Wired up and working:**
- All 17 Astro pages build (`astro build`) and serve via `astro preview`
- Playwright config at `astro/playwright.config.ts` reuses CRA baselines via `snapshotPathTemplate`
- `astro/e2e/visual-regression.spec.ts` mirrors the CRA spec
- `VISUAL_TEST_MODE=true` env var on `astro build` replaces hero/section images with gray placeholders
- Yarn scripts: `build`, `build:test`, `preview`, `test:visual`, `test:visual:update`
- SCSS modules ported into `astro/src/components-styles/` and imported by Astro components
- Staging deploy auto-detects astro/ and ships from `astro/dist/`
- CloudFront Function deploy is automated (PR #86 merged)

**Failing — visual diffs vs production CRA:**
- Logo SVG `fill`/`stroke` not picking up `.logo-yellow` / `.logo-blue` rules — renders with no colour, missing the circle outline
- Menu items running horizontally instead of stacked vertically
- `SectionHeader` doesn't include the route-specific section menu (the `about | shop | rent a space | contact`-style links visible top-right of every CRA page)
- `Menu` parent items (`classes`, `event workshops`) not rendering with leading dashes on children
- Yellow announcement panel sizing differs from CRA
- Small layout offsets across most routes

## Debug loop (use this verbatim)

```bash
cd /home/lexey/IdeaProjects/palavara-v3/astro

# Node 18 doesn't work with Playwright 1.59 — switch first, every session.
eval "$(/home/lexey/.local/share/fnm/fnm env)" && fnm use v22.22.0

# Build in test mode (gray placeholders for images), then run a single
# test to keep iteration fast.
yarn build:test
yarn test:visual --project=chromium-desktop -g "home"

# Inspect the diff:
#   test-results/visual-regression-home---visual-regression-chromium-desktop/home-diff.png
#   test-results/visual-regression-home---visual-regression-chromium-desktop/home-actual.png
# Compare to expected:
#   ../e2e/visual-regression.spec.ts-snapshots/home-chromium-desktop-linux.png

# Edit the offending component (Logo.astro / Menu.astro / etc.)
# Then re-run:
yarn build:test && yarn test:visual --project=chromium-desktop -g "home"
```

The pattern: one route × one viewport at a time until green, then expand.

## Suggested order of attack

Fix shared issues first — they compound across all routes.

1. **Logo SVG colour** (affects all 17 pages × 3 viewports = 48 tests).
   Probable cause: the `<a class={logoYellow}><Logo /></a>` pattern. Logo.astro renders `<svg>` directly. CSS rule is `.logo-yellow svg { fill: yellow; stroke: yellow; }` (after hashing). The hashed class is on the `<a>`, the descendant `<svg>` selector should match.
   - Verify in built HTML: `grep -A2 'svg' astro/dist/index.html | head` — what classes are actually on the `<a>` and svg?
   - Verify in built CSS: `grep 'logo' astro/dist/_astro/*.css` — does `.<hashed-logoYellow> svg` rule exist?
   - Likely fix: ensure `<Logo />` produces a single `<svg>` element with no wrapping. Or apply `class="logo-yellow"` directly to the svg.

2. **Menu items stacking vertically** (affects all pages).
   `Menu.module.scss` has `.menu-item { display: block; padding: 5px 10px; line-height: 1; }`. If items run horizontally, the hashed class isn't being applied.
   - Verify in built HTML: are the hashed `menuItem` class names actually present on the `<a>` elements?
   - Astro's CSS-modules + `class:list` interaction: confirm `class:list={[styles.menuItem, ...]}` produces the hashed name. Try `class={styles.menuItem}` if that fails.

3. **Section menu** (the route-specific links shown in `SectionHeader`).
   Currently `SectionHeader.astro` only renders `HeaderLinks`. The CRA `SectionHeader.tsx` also renders `SectionMenuBlue` / `SectionMenuWhite`. Need to add a `SectionMenu.astro` that renders the route's `sectionMenu` items.
   - Source of truth in CRA: `src/routes/common/sectionMenu.ts` (route → list of section menu items).
   - For the spike, simplest: each section page's menu shows the same set of links shown in the screenshot (about, shop, rent a space, contact). Copy from CRA.

4. **Yellow announcement** sizing — likely fixed once the surrounding `.content` grid is correct (App.module.scss). Re-test after #1–#3.

5. **Per-page route content** offsets — should be small after the above. Sweep through remaining routes.

## Acceptance criteria

```bash
cd /home/lexey/IdeaProjects/palavara-v3/astro
yarn build:test
yarn test:visual
# Expect: "48 passed"
```

When all 48 are green, push the branch (PR #85 will redeploy). Then think about merging the spike to main, or keeping it as the long-term comparison reference.

## Useful file paths

| What | Where |
|---|---|
| Astro pages | `astro/src/pages/*.astro` |
| Layouts | `astro/src/layouts/{BaseLayout,SectionLayout}.astro` |
| Components | `astro/src/components/{Logo,Menu,HeaderLinks,SectionHeader,HomeHeroCarousel,SectionVisual,HeadMeta,AnalyticsScripts}.astro` |
| Ported SCSS modules | `astro/src/components-styles/*.module.scss` |
| Original SCSS (reference) | `src/components/*.module.scss` |
| Original React components (structure reference) | `src/components/*.tsx`, `src/routes/**/*.tsx` |
| Test config | `astro/playwright.config.ts` |
| Test spec | `astro/e2e/visual-regression.spec.ts` |
| Baselines (shared with CRA, read-only — DO NOT update) | `e2e/visual-regression.spec.ts-snapshots/` |

## Gotchas

- **Node version**: must use 22+ (`fnm use v22.22.0`). Node 18 fails Playwright esm loading. Run `eval "$(/home/lexey/.local/share/fnm/fnm env)" && fnm use v22.22.0` at session start.
- **Playwright browser install** without sudo: works since chromium is already in `~/.cache/ms-playwright/`. If it asks for sudo, install with `npx playwright install chromium` (no `--with-deps`).
- **Don't edit `e2e/visual-regression.spec.ts-snapshots/`** — these are the production baselines we're matching against.
- **Don't run `yarn test:visual:update`** — that overwrites the production baselines. Only run plain `yarn test:visual`.
- **Reuse server**: by default `webServer.reuseExistingServer = true` outside CI. After the first `yarn build:test && yarn preview`, subsequent `yarn test:visual` calls reuse the running server. Restart the preview server after rebuilding.

## Ground truth references (for matching)

The diff says the Astro output should look like these screenshots:

```
e2e/visual-regression.spec.ts-snapshots/
  home-chromium-{desktop,tablet,mobile}-linux.png
  kids-class-chromium-{desktop,tablet,mobile}-linux.png
  ... etc, 48 files total
```

Open them to see exactly what to match.

## Estimate

3–5 hours of focused iteration in a single session, assuming the first fix (logo colour) cascades to several green tests immediately.
