# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Node.js Environment Setup

This project uses **fnm** (Fast Node Manager) for Node.js version management. Before running any node/yarn/npm commands, initialize fnm:

```bash
eval "$(/home/lexey/.local/share/fnm/fnm env)"
```

**Why this is needed:** Claude Code's shell doesn't automatically source `~/.bashrc`, which contains the fnm initialization. All commands using node, yarn, or npm must be prefixed with the fnm initialization.

**Example:**
```bash
# Wrong (will fail with "command not found")
yarn start

# Correct
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn start
```

Use **yarn** (not npm) for all package management and script execution in this project.

## Git & GitHub Workflow

**CRITICAL: ALL remote git operations (push, PR creation, etc.) MUST use the GitHub MCP server.**

The GitHub MCP server is configured with bot credentials (k5qkop-bot) and handles all remote GitHub operations automatically. You do NOT need to manually switch credentials or use bash commands for GitHub API operations.

**Local git config:** Can remain as any user (lexey or bot) - doesn't matter since only remote operations matter.

**Bot Account (k5qkop-bot):**
- **Username:** k5qkop-bot
- **Email:** tblz+k5qkop-bot@proton.me
- Used automatically by GitHub MCP server for all remote operations

### GitHub MCP Server Usage

**ALWAYS use GitHub MCP server tools** for:
- Listing and viewing issues
- Assigning issues
- Creating/updating pull requests
- Pushing code to remote
- Managing branches on remote
- All other GitHub API operations

**DO NOT use:**
- `gh` CLI commands for GitHub operations
- Manual `git push` commands (use MCP)
- Manual credential switching scripts
- Bash scripts for GitHub API calls

The MCP server handles authentication with bot credentials automatically.

## GitHub Issue Workflow

### 1. Working on an Issue

Typical workflow using GitHub MCP tools:

1. **List/view issues** using GitHub MCP tools
2. **Create feature branch** locally:
   ```bash
   git checkout -b N-short-description
   ```
   **Branch naming:** `N-short-description` where N is issue number
   - Example: `1-kids-class-pricing`, `17-remove-unused-vars`

3. **Make code changes** and commit locally:
   ```bash
   git add <files>
   git commit -m "$(cat <<'EOF'
   Brief description of change

   Fixes #N

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```
   **Important:** Include `Fixes #N` to auto-close issue when PR merges

4. **Push and create PR** using GitHub MCP tools:
   - Push branch to remote via MCP
   - Create PR via MCP with:
     - Title: Brief description
     - Body: Changes list + `Fixes #N`
     - Assignee: k5qkop-bot

**PR body format:**
```markdown
## Changes
- Change description

Fixes #N

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 2. After PR is Merged

Use standard git commands for local cleanup:
```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Delete local branch
git branch -d N-short-description
```

## Deployment

### GitHub Actions Deployment

Production deployment via GitHub Actions (`.github/workflows/deploy-production.yml`). The workflow:
- Triggers **manually only** via GitHub Actions UI
- Builds the production bundle
- Syncs to S3 bucket: `studio.palavara.com`
- Invalidates CloudFront distribution: `E3HIR7ZV6FCTFO`
- AWS region: `eu-central-1`

**Required GitHub Secrets:**
Configure these in repo Settings → Secrets and variables → Actions:
- `AWS_ACCESS_KEY_ID` - AWS access key for S3/CloudFront access
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `REACT_APP_SENTRY` - Sentry DSN URL (from `.env.production`)

**How to deploy:**
1. Go to GitHub repo → Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow" → Run workflow
4. Monitor deployment progress in Actions tab

### Manual Deployment (Local)

For manual deployments from local machine:

```bash
# Deploy to production (builds and syncs to S3 + invalidates CloudFront)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn deploy-prod
```

**Note:** Requires AWS CLI configured with credentials locally. Automated deployment via GitHub Actions is preferred.

## Build & Development Commands

```bash
# Start development server (opens in Google Chrome)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn start

# Build for production
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn build

# Run tests
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test
```

Test files live in `tests/` directory (not `src/`), with setup in `tests/setupTests.ts`. Test file pattern: `tests/**/*.test.{js,jsx,ts,tsx}`

## Visual Regression Testing

Playwright-based visual regression tests ensure UI consistency across all pages and viewports.

### Running Visual Tests

```bash
# Run visual tests (compares screenshots to baseline)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual

# Update baseline screenshots (after intentional UI changes)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:update

# Open Playwright UI mode for interactive debugging
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:ui

# View HTML report of last test run
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test:visual:report
```

### Visual Test Mode

Visual tests run with `REACT_APP_VISUAL_TEST_MODE=true` environment variable, which:
- Replaces all images with gray placeholder boxes (`#e0e0e0`)
- Prevents image loading variance from causing false test failures
- Ensures consistent screenshots across test runs
- Configured automatically in `playwright.config.ts` webServer env

Implementation in `src/config.ts` and `src/components/Images.tsx`.

### Test Coverage

Tests run on 3 viewport sizes (desktop, tablet, mobile) across all 16 routes:
- Home, Kids Class, Wheel Throwing, Family Saturday
- Open Studio, Firing Service, Gift Certificate, Team Events
- Birthday Parties, Membership, About Me, Rent a Space
- Contact, Impressum, AGB, Datenschutzerklärung

Total: 48 test cases (16 routes × 3 viewports)

### CI/CD Integration

Visual tests run automatically on GitHub Actions via `.github/workflows/visual-tests.yml`. Tests must pass before PRs can be merged.

## Architecture

This is a React + TypeScript SPA for a pottery studio (Palavara), using a custom client-side routing system rather than React Router.

### State Management

**Redux Toolkit + Redux Saga** pattern:
- Store configuration: `src/store.ts` - minimal Redux slice (`ui`) with saga middleware
- Root saga: `src/sagas/rootSaga.ts` → `src/sagas/initSaga.ts` kicks off app initialization
- Application state flows through `TAppState` union type (NOT_STARTED → IN_PROGRESS → READY or ERROR)
- State shape in `src/types.ts`: includes current route, menu state, screen size, and navigation structure

### Custom Routing System

Routes are defined as an enum + route definitions in `src/router.ts`:
- Route enum: `ERoute` (HOME, KIDS_CLASS, WHEEL_THROWING, etc.)
- Route definitions: `routeDefs` array maps route names to URL patterns
- Each route gets its own directory in `src/routes/[routeName]/` with component + domain logic
- Navigation handled via custom history integration in `src/utils/routerUtils.ts`
- Location changes watched by `src/sagas/locationWatcherSaga.ts`

When adding a new route:
1. Add enum value to `ERoute` in `src/router.ts`
2. Add to `TRoute` union type in `src/router.ts`
3. Add route definition to `routeDefs` array
4. Create directory `src/routes/[routeName]/` with component

### Menu System

Hierarchical menu structure defined in app state (`TReadyAppState`):
- Menu types: ROOT, PARENT, CHILD, SIMPLE (enum `EMenuType`)
- Two menu views: main navigation menu (`TMenuItem`) and section menu (`TSectionMenuItem`)
- Section menu has mobile display types: MAIN, SECONDARY

### Application Initialization Flow

1. `src/index.tsx` renders root with Redux Provider + i18n
2. `initStore()` runs root saga → `initSaga`
3. `initSaga` sequence:
   - Sets app state to IN_PROGRESS
   - Sets up browser history listener
   - Initializes i18n (default: EN)
   - Sets up resize observer for responsive behavior
   - Waits for initial screen size event
   - Forks `uiSaga` for ongoing UI state management
   - Dispatches initial route change request

### Internationalization

i18next integration in `src/services/i18n.ts`:
- Languages watched via `src/sagas/langWatcherSaga.ts`
- Uses i18next-browser-languagedetector + i18next-http-backend

### Error Handling

- Sentry integration: `src/services/sentry.ts` (initialized in `index.tsx`)
- React error boundary: `src/components/ErrorBoundary`

### Responsive Design

- Screen size detection: `src/routes/common/screenSize.ts` with `EScreenSize` enum
- Resize observer service: `src/services/resizeObserver.ts`
- Screen size changes flow through Redux state and affect menu collapsibility

## Environment Variables

Two env files:
- `.env` - development
- `.env.production` - contains `BUCKET_NAME` and `DISTRIBUTION_ID` for AWS deployment

## Code Conventions

- Prefix type names with `T`: `TAppState`, `TRoute`, `TMenuItem`
- Prefix enum names with `E`: `ERoute`, `EAppState`, `EMenuType`
- Use `classnames` (imported as `cn`) for conditional CSS classes
- SASS modules: components import `.module.scss` files
- Actions defined in `src/actions.ts` using a custom action creator pattern
