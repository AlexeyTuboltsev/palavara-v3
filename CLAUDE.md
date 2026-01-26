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

## Git Configuration

**Default:** Git uses user credentials (lexey / tblz@proton.me)

**Bot Account:** For automated GitHub issue workflows, temporarily switch to bot credentials:
- **Bot username:** k5qkop-bot
- **Bot email:** tblz+k5qkop-bot@proton.me
- **Bot token:** Stored in `~/.github-tokens` file

**Tokens file format** (`~/.github-tokens`):
```bash
BOT_TOKEN=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
USER_TOKEN=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
```

### Switching to Bot Credentials

```bash
# Switch to bot (before working on GitHub issues)
source ~/.github-tokens
git config --global user.name "k5qkop-bot"
git config --global user.email "tblz+k5qkop-bot@proton.me"
echo "https://k5qkop-bot:${BOT_TOKEN}@github.com" > ~/.git-credentials
```

### Switching Back to User Credentials

```bash
# Switch back to user (after completing automated work)
source ~/.github-tokens
git config --global user.name "lexey"
git config --global user.email "tblz@proton.me"
echo "https://AlexeyTuboltsev:${USER_TOKEN}@github.com" > ~/.git-credentials
```

**Important:** Always switch back to user credentials after completing automated GitHub issue workflows.

## GitHub Issue Workflow

When working on GitHub issues, follow this workflow:

### 0. Switch to Bot Credentials

```bash
source ~/.github-tokens
git config --global user.name "k5qkop-bot"
git config --global user.email "tblz+k5qkop-bot@proton.me"
echo "https://k5qkop-bot:${BOT_TOKEN}@github.com" > ~/.git-credentials
```

### 1. List and Read Issues

```bash
# List all open issues
curl -s -H "Authorization: token $(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//')" \
  https://api.github.com/repos/AlexeyTuboltsev/palavara-v3/issues \
  | jq -r '.[] | "Issue #\(.number): \(.title)\n  State: \(.state)\n"'

# Get details of specific issue
curl -s -H "Authorization: token $(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//')" \
  https://api.github.com/repos/AlexeyTuboltsev/palavara-v3/issues/1 \
  | jq -r '"Issue #\(.number): \(.title)\n\(.body)"'
```

### 2. Assign Issue to Bot

```bash
# Assign issue N to k5qkop-bot
curl -s -X POST \
  -H "Authorization: token $(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//')" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/AlexeyTuboltsev/palavara-v3/issues/N/assignees \
  -d '{"assignees":["k5qkop-bot"]}' \
  | jq -r '"Issue #\(.number) assigned to: \(.assignees[].login)"'
```

### 3. Create Feature Branch

```bash
# Create and switch to new branch (format: N-short-description)
# Example: 1-kids-class-pricing
git checkout -b N-short-description
```

**Branch naming convention:** `N-short-description` where N is the issue number (e.g., `1-kids-class-pricing`, `2-family-saturday-pricing`).

### 4. Make Changes and Commit

```bash
# Make your code changes, then commit
git add <files>
git commit -m "$(cat <<'EOF'
Brief description of change

Fixes #N

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Important:** Include `Fixes #N` in the commit message to automatically close the issue when the PR is merged.

### 5. Push Branch

```bash
git push -u origin N-short-description
```

### 6. Create Pull Request

```bash
# Create PR using GitHub API
PR_NUMBER=$(curl -s -X POST \
  -H "Authorization: token $(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//')" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/AlexeyTuboltsev/palavara-v3/pulls \
  -d '{
    "title": "Brief description of change",
    "body": "## Changes\n- Change description\n\nFixes #N\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)",
    "head": "N-short-description",
    "base": "main"
  }' | jq -r '.number')

echo "PR created: https://github.com/AlexeyTuboltsev/palavara-v3/pull/$PR_NUMBER"

# Assign PR to bot
curl -s -X POST \
  -H "Authorization: token $(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//')" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/AlexeyTuboltsev/palavara-v3/issues/$PR_NUMBER/assignees \
  -d '{"assignees":["k5qkop-bot"]}' > /dev/null

echo "PR #$PR_NUMBER assigned to k5qkop-bot"
```

**Important:** Only include `Fixes #N` in the PR body - GitHub will automatically link to the issue.

### 7. Switch Back to User Credentials

```bash
source ~/.github-tokens
git config --global user.name "lexey"
git config --global user.email "tblz@proton.me"
echo "https://AlexeyTuboltsev:${USER_TOKEN}@github.com" > ~/.git-credentials
```

**Important:** Always do this immediately after creating the PR.

### 8. After PR is Merged

```bash
# Switch back to main and pull latest
git checkout main
git pull origin main

# Delete local branch
git branch -d N-short-description

# Optionally delete remote branch (if not auto-deleted)
git push origin --delete N-short-description
```

## Build & Development Commands

```bash
# Start development server (opens in Google Chrome)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn start

# Build for production
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn build

# Run tests
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn test

# Deploy to production (builds and syncs to S3 + invalidates CloudFront)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn deploy-prod
```

Test files live in `tests/` directory (not `src/`), with setup in `tests/setupTests.ts`. Test file pattern: `tests/**/*.test.{js,jsx,ts,tsx}`

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
