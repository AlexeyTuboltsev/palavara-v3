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

**CRITICAL: ALL git operations (commits, pushes, PRs) MUST be done using bot credentials.**

**Bot Account (k5qkop-bot):**
- **Username:** k5qkop-bot
- **Email:** tblz+k5qkop-bot@proton.me
- **Token:** Stored in `~/.github-tokens` file

**User Account (lexey):**
- **Username:** lexey
- **Email:** tblz@proton.me
- **Token:** Stored in `~/.github-tokens` file

**Tokens file format** (`~/.github-tokens`):
```bash
BOT_TOKEN=<bot-github-token>
USER_TOKEN=<user-github-token>
```

### Required Workflow for ALL Git Operations

**ALWAYS follow this pattern for any git commit, push, or PR:**

1. **Switch to bot credentials BEFORE any git operation**
2. **Perform the git operation (commit, push, create PR)**
3. **Switch back to user credentials IMMEDIATELY after**

You do NOT need user permission to switch credentials - just do it automatically.

### Switching to Bot Credentials

```bash
# Switch to bot (BEFORE any git commit/push/PR)
source ~/.github-tokens
git config --global user.name "k5qkop-bot"
git config --global user.email "tblz+k5qkop-bot@proton.me"
echo "https://k5qkop-bot:${BOT_TOKEN}@github.com" > ~/.git-credentials
```

### Switching Back to User Credentials

```bash
# Switch back to user (IMMEDIATELY after git operation completes)
source ~/.github-tokens
git config --global user.name "lexey"
git config --global user.email "tblz@proton.me"
echo "https://AlexeyTuboltsev:${USER_TOKEN}@github.com" > ~/.git-credentials
```

**IMPORTANT:**
- NEVER commit or push as user (lexey)
- ALWAYS use bot credentials (k5qkop-bot) for all git operations
- ALWAYS switch back to user credentials after completing the git operation
- This applies to ALL commits, not just issue-related work

## GitHub Issue Workflow (Automated)

### Starting Work on an Issue

Use the automated script to start working on a GitHub issue:

```bash
# Start working on issue #17
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn issue 17
```

**What the script does:**
1. Checks for uncommitted changes (fails if any exist)
2. Automatically switches to main branch (if not already on it)
3. Switches to bot credentials
4. Pulls latest from origin/main
5. Fetches and displays issue details
6. Assigns issue to k5qkop-bot
7. Creates feature branch with format `N-short-description`
8. Switches back to user credentials

**Branch naming:** Auto-generates from issue number and title (e.g., `17-remove-unused-vars`)

**Script location:** `scripts/start-issue.js`

### Creating a Pull Request

Use the automated script to create pull requests with proper credential switching:

```bash
# From your feature branch (after committing changes)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn pr

# With custom title
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn pr --title "Custom PR title"

# With issue number (if branch name doesn't follow N-description format)
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn pr --issue 42
```

**What the script does:**
- Validates current state (not on main, no uncommitted changes)
- Auto-detects issue number from branch name (e.g., `16-description` → `Fixes #16`)
- Generates PR title and body from commit history
- Switches to bot credentials
- Pushes branch if needed
- Creates PR via gh CLI and assigns to k5qkop-bot
- **Always** switches back to user credentials (even on failure)

**Script location:** `scripts/create-pr.js`

### Complete Automated Workflow Example

```bash
# 1. Start working on issue
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn issue 17

# 2. Make your changes
# ... edit files ...

# 3. Commit your work
git add <files>
git commit -m "Your commit message

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 4. Create PR
eval "$(/home/lexey/.local/share/fnm/fnm env)" && yarn pr
```

## Manual GitHub Issue Workflow

If you need manual control instead of using the automated scripts (`yarn issue` and `yarn pr`):

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
GH_TOKEN=$(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//') gh issue list

# Get details of specific issue
GH_TOKEN=$(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//') gh issue view N
```

### 2. Assign Issue to Bot

```bash
# Assign issue N to k5qkop-bot
GH_TOKEN=$(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//') gh issue edit N --add-assignee k5qkop-bot
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
# Create PR using gh CLI and assign to bot
GH_TOKEN=$(grep github.com ~/.git-credentials | sed 's/.*://' | sed 's/@.*//') gh pr create \
  --title "Brief description of change" \
  --body "## Changes
- Change description

Fixes #N

🤖 Generated with [Claude Code](https://claude.com/claude-code)" \
  --assignee k5qkop-bot
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
