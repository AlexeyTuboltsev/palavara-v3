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

Git credentials are stored in `~/.git-credentials` for HTTPS authentication. The credential helper is set to `store` mode.

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
