# TODO

## Wire up Sentry sourcemaps

Currently Sentry receives minified stack traces (no file/line info). Fixing this has two sides — some UI setup you need to do, then a PR I can open.

### Your part (Sentry + GitHub UI, ~5 min)

1. **Create a Sentry internal integration token**
   - https://sentry.io → Settings → Developer Settings → **Internal Integrations** → **Create New Integration**
   - Name: `palavara-sourcemap-upload`
   - Permissions: **Release** = Admin, **Project** = Read
   - Save and copy the generated token

2. **Find the Sentry org and project slugs**
   - When browsing an issue: `sentry.io/organizations/{ORG_SLUG}/issues/...`
   - Project name appears in the breadcrumb

3. **Add three GitHub secrets** at https://github.com/AlexeyTuboltsev/palavara-v3/settings/secrets/actions:
   - `SENTRY_AUTH_TOKEN` — the token from step 1
   - `SENTRY_ORG` — the org slug
   - `SENTRY_PROJECT` — the project slug

### My part (one PR, once secrets exist)

- Add `release: process.env.REACT_APP_RELEASE` to `Sentry.init()` in `src/services/sentry.ts`, pass the git SHA as that env var at build time
- Add a step to `.github/workflows/deploy-production.yml` using `getsentry/action-release@v1` that:
  - Creates a Sentry release tagged with the git SHA
  - Uploads sourcemaps + bundles from `build/`
  - Associates commits
  - Finalizes the release
- Optionally strip `.map` files from the S3 upload (they go to Sentry, not the public web) — this also silences the Firefox "XML Parsing Error" console noise

### When to revisit

When a real Sentry error comes in and we want a readable stack trace. The one-off iOS `RangeError` we saw earlier is the kind of thing this would help diagnose.


## Legal / cookies / GDPR review across all public Palavara sites

End-to-end audit of every public-facing surface for legal / privacy / GDPR compliance. Germany has stricter requirements than most (Impressum per § 5 TMG, DSGVO/GDPR, TTDSG for cookie consent). Particularly important now that the booking flow stores PII (student name + email + payment refs).

### Surfaces — current state

| Surface | Repo | State |
|---|---|---|
| `palavara.com` (artist site) | palavara-front-v1 | **Still pending** — no Impressum, no Datenschutz at all (audit C6). |
| `studio.palavara.com` (studio site) | palavara-v3 | ~~Datenschutz / AGB rewritten~~ ✓ (PR #133, draft for lawyer review). ~~Site-wide footer with three legal links~~ ✓ (PR #132). |
| `book.palavara.com` (booking page) | palavara-v3 (`scheduler/frontend/`) | ~~Footer with Impressum / AGB / Datenschutz on every page~~ ✓ (PR #132). ~~AGB consent line above PayPal button~~ ✓ (PR #132). |
| Confirmation / cancellation emails | palavara-v3 (`scheduler/backend/src/email/`) | ~~Impressum block in all five templates~~ ✓ (PR #132). |
| `data.palavara.com/admin/v2/` | palavara-admin | Auth-gated, internal. Lower priority. |

### Items — current state

- [x] ~~**Impressum** on `studio.palavara.com`~~ — exists at `/impressum`, content unchanged (no factual issues).
- [ ] **Impressum** on `palavara.com` (artist site) — still missing entirely.
- [x] ~~**Datenschutzerklärung** rewrite for the actual architecture~~ — PR #133 covers booking PII, CloudFront logs, SES, Google Calendar sync, PayPal, Umami, Sentry; Art. 6 legal bases; processor table; rights + Berlin BlnBDI. **Lawyer review pending before live cutover.**
- [x] ~~**AGB** rewrite for the new flow~~ — PR #133 updates §§ 2–4 (online booking, PayPal upfront, in-email cancel link) and adds new § 5 (Widerrufsrecht / § 312g BGB exemption). **Lawyer review pending.**
- [x] ~~**Cookie consent / TTDSG**~~ — Umami is cookieless and has no Local Storage, so no banner required (disclosed in Datenschutz § 7 + § 9 anyway). Booking page sets no cookies either.
- [x] ~~**Booking page disclosures** (Impressum / AGB / Datenschutz links + cancellation policy reachable before payment)~~ — PR #132.
- [x] ~~**Email footers** (Impressum block on every transactional mail)~~ — PR #132.
- [ ] **Data retention** — DynamoDB rows still kept indefinitely. Implement TTL (~24 months past workshop date) — audit M2.
- [ ] **Right to erasure** — currently manual via `aws dynamodb delete-item`. Document the procedure in Datenschutz § 12 and ideally add an admin-app endpoint — audit M3.
- [ ] **Phone number on Impressum** — § 5 TMG borderline if email-only. Add a number when you have one — audit L1.
- [ ] **Lawyer review** of rewritten Datenschutz + AGB before live PayPal cutover.

### When to do it

The blockers for the live PayPal cutover are: lawyer review of the new texts, the artist-site Impressum, and the data-retention story. The other items can land after.


## Booking data model: parent `Booking` with `sessions: [...]`

Today the scheduler stores **one DynamoDB row per session** even for 4-session cycles, linked by a shared `cycleId` (UUID). The "first session's `bookingId` stands in for the bundle" pattern is a leaky abstraction — only the first id is ever surfaced in PayPal / emails / URL params, the other three are internal plumbing the user never sees.

### Target shape

```
Booking {
  bookingId,            // single user-facing id, shown in PayPal/email/URL
  lessonType,
  refundStatus,
  amountCents,
  paypalOrderId, paypalCaptureId, paypalRefundId,
  sessions: {
    <sessionId>: Session,
    ...
  }
}

Session {
  sessionId,
  date, timeSlot, slotEnd,
  refundStatus?,        // open question: refund tracking per-booking or per-session?
}
```

### Why

- One canonical id per booking — no more "first-session-id stands in for the bundle".
- Refund / cancellation state lives in one place instead of being denormalised across N rows.
- Per-session operations (skip session 3, reschedule it later) become addressable without unwinding the whole bundle.

### Touchpoints

- `palavara-bookings` PK schema — single item per Booking, `sessions` as a Map attribute, or sessions as a separate table keyed by `(bookingId, sessionId)`.
- `createCycleBooking` (`scheduler/backend/src/handlers/createBooking.js`) — write one row instead of a TransactWriteItems of N.
- `findCycleSiblings` / `transactUpdateAll` (`utils/cycleLogic.js`) — collapse into "load the booking" / "update the booking".
- All four cycle email senders (`email/index.js`) — read sessions from `booking.sessions` instead of a passed-in `siblings[]`.
- Per-session Google Calendar inserts (`captureOrder`, `processCancellation`) — loop over `booking.sessions`.
- `processCancellation` (`utils/cancelLogic.js`) — refund logic simplifies (one row, one refund state).
- Frontend `confirm.js` + `cancel.js` — already happy with `cycleSiblings[]`; just point them at `booking.sessions` instead.

### Rollover plan

Coexistence is necessary — existing per-row cycle bookings can't all be migrated atomically:

1. Land the new write path so new bookings use the parent-child shape.
2. Add a read shim that recognises old row-per-session bookings (presence of `cycleId`, no `sessions` Map) and synthesises a parent view on the fly.
3. Backfill: one-off Lambda that reads all rows with `cycleId`, writes the parent Booking, leaves old rows in place (status `migrated`) until enough time has passed.
4. Once no active per-row cycle bookings remain (cancel / expire / past date), delete the migrated leftovers.

### When to do it

After the live-PayPal launch settles. Not blocking anything today — current flow works. The longer it's deferred, the more refund-state denormalisation code accumulates. Worth pulling forward if a "partial cancel / reschedule one session" feature is requested.


## Split the scheduler into its own repo + set up the test stack

The booking system (`scheduler/` subdir) shares zero code with the React studio site — they're in the same repo only because they started together. Splitting reduces cognitive surface per repo, decouples CI, and gives the test stack a clean home.

**Order: split first, then tests.** The scheduler is in production and behaving correctly; no urgent need to lock behaviour in with tests *right now*. Writing tests against the messy combined repo would mean refactoring them during the split.

### Phase 1 — Repo split (~half day)

1. Create the empty repo `palavara-scheduler` on GitHub.
2. `git filter-repo --path scheduler/ --path-rename scheduler/:` from a clone of palavara-v3 → push to the new repo. Keeps the scheduler's commit history; everything else is gone.
3. Move workflows: `.github/workflows/deploy-scheduler.yml` and `.github/workflows/deploy-booking-frontend.yml`. Delete the originals from palavara-v3.
4. Recreate GitHub Actions secrets in the new repo (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, anything Sentry-related once that's wired). Bot needs write access.
5. Write a thin `CLAUDE.md` for the new repo (mostly: yarn for nothing here, deploy workflows live in `.github/workflows/`, AWS region `eu-central-1`, GitHub MCP for remote ops).
6. Update `palavara-v3/CLAUDE.md`: remove scheduler-specific sections; delete `scheduler/` dir from the working tree.
7. Smoke test: trigger `Deploy Scheduler Stack` + `Deploy Booking Frontend` from the new repo; place a real test booking; cancel it; verify the calendar event lands and gets deleted. Half an hour of poking.

### Phase 2 — Test infrastructure (~1–2 days)

**Layout: `docker-compose.yml` in the new repo root spins up the local test rig:**

- `localstack/localstack` (Community edition is enough): DynamoDB, SES, Lambda runtime, API Gateway, SSM. Endpoint at `http://localhost:4566`. Test code points `endpoint` at this; production code reads `AWS_ENDPOINT_URL` env var so the same Lambdas run under LocalStack unchanged.
- `wiremock/wiremock`: imposter for the PayPal + Google Calendar HTTP APIs. Scenario YAML files in `tests/wiremock/` script `createOrder → approve → capture → refund` and the failure variants (`decline`, `503`, `webhook signature_invalid`).
- (Optional) `axllent/mailpit` if LocalStack's SES capture doesn't fit. Default is to use LocalStack — call `/_localstack/ses/messages` from tests to fetch the rendered MIME.

**Test layers:**

- **Unit (Jest + nock)** — Lambda-handler tests with HTTP stubs for PayPal/Google. `package.json` already declares jest; just no tests written. Goal: cover refund-eligibility math, cycle-sibling fan-out, eventIdFromBookingId edge cases.
- **Email rendering (Jest + LocalStack SES)** — fire `sendBookingConfirmation` with mock booking data, fetch the rendered MIME from LocalStack, snapshot the HTML body and the .ics attachment. Catches template drift.
- **Visual regression (Playwright + mocked fetch)** — same pattern as palavara-v3's studio-site suite. Playwright route handlers return canned API responses; screenshot every state (lesson picker, date picker, cycle progress at each pick-count, form, confirm success/pending/error, cancel confirm/cancelled/error).
- **E2E (Playwright + the full Docker rig)** — drive the browser through happy path + the failure scenarios (PayPal decline, capture timeout, webhook tampering, double-click, refund eligibility boundary at exactly 7 days). The PayPal "approve" redirect is intercepted by Playwright and POSTed directly to the capture endpoint with a synthetic order id — mirrors a real user click without leaving the test browser.

**Test data:** seed LocalStack DynamoDB with a fixture set (one of each lesson type, a slot per upcoming weekday for the next two weeks) before each test run. Tear down between runs.

### Phase 3 — CI integration

- Unit + email-render + visual: run on every PR. Fast (<3 min). Required for merge.
- E2E: run on every PR too, but as a separate workflow with `docker-compose up` warm-up. ~5–8 min. Required for merge.
- LocalStack + WireMock containers in GitHub Actions via `services:` blocks or `docker-compose up -d` in a step. Free tier of GH Actions Linux runners handles this comfortably.

### Caveats

- LocalStack captures **what code tried to send** — not how Gmail/Outlook actually render the HTML. Templates that pass the snapshot test can still look broken in production mail clients. Keep doing the manual `preview-emails.js` review when template structure changes.
- WireMock's PayPal scenarios drift from real PayPal whenever PayPal changes their API. Run the existing PayPal-sandbox smoke booking once a month-ish to catch that.
- Don't gate merges on E2E flakiness before the suite is stable. Run E2E as advisory for the first week; promote to required only once it's been green 20 runs in a row.

### When to do it

After the slot-calendar-availability question is resolved (whatever the owner picks). Anything earlier risks scope-creeping the test setup into "test the live-calendar UX too" before the design is settled.

## Booking sender address needs a catchall (or equivalent)

`palavara-scheduler` sends confirmation + cancellation emails from
`SES_FROM_ADDRESS` (defaults to `bookings@studio.palavara.com` in
`template.yaml`, may be different in CFN parameter store). Customers
who reply to those emails write to the *from* address — not always
the `Reply-To` header — and if no inbox catches `bookings@studio.palavara.com`
their reply silently bounces.

**Options:**
- Catchall on `studio.palavara.com` → forwards everything to `palavarastudio@gmail.com`. Cheapest. (Whatever the DNS provider supports; for Route 53 + a mail forwarder like ImprovMX, the catchall is one MX record + a per-domain alias.)
- Verified mailbox `bookings@studio.palavara.com` actually hosted somewhere.
- Switch `SES_FROM_ADDRESS` to the personal Gmail (less professional, but every reply lands).

**Trigger:** before any customer hits "reply" on a confirmation email. Currently they could and we'd never know.


## IAM review

`palavara_dev` has accumulated several inline-policy additions over the past few sessions (staging frontend infra, booking observability, etc.). Each one was scoped tightly to the task but they were never reviewed as a whole. Worth one pass to:
- Audit which policies are still load-bearing vs. dead.
- Consolidate overlapping statements (e.g. multiple S3 / DDB blocks across different policies for the same buckets/tables).
- Move broad-action statements (e.g. `sns:*`) to narrower lists once the resource set is stable.
- Consider replacing the deploy user with a deploy role + OIDC trust, so the GH workflows assume the role via short-lived creds instead of long-lived AWS access keys in secrets.

**Trigger:** after the current observability/staging work has shaken out for a week or so (don't re-architect IAM while we're still iterating on what the stack needs).

