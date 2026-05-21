# Legal / GDPR / cookies review — findings

**Date:** 2026-05-08
**Scope:** all public-facing Palavara surfaces (`palavara.com`, `studio.palavara.com`, `book.palavara.com`, transactional emails)
**Status:** read-only audit. No fixes applied. Per TODO in `palavara-v3/todo.md`.

This is what I found by curl-ing each surface and reading the source. Treat as a punch list before live PayPal cutover; severities are my best read but a German lawyer should approve the final wording.

---

## TL;DR

| Severity | Issues | Where |
|---|---|---|
| **Critical (blocks live cutover)** | 5 | Datenschutz / AGB content; cookie consent; book.palavara.com legal links; palavara.com Impressum missing |
| **Medium** | 3 | Email footers; data retention; right-to-erasure process |
| **Low** | 2 | Impressum phone; "Stand" date stamp |

The two highest-impact items: (1) `studio.palavara.com/datenschutzerklaerung` is **materially incorrect** for the current architecture, and (2) `palavara.com` (artist site) has **no Impressum at all**.

---

## Per-surface state today

### palavara.com (artist site, palavara-front-v1)

- **Impressum:** ❌ none. Site has `/`, `/graphics`, `/ceramics`, `/illustrations`, `/info` only. No `/impressum`, no `/datenschutzerklaerung`, no AGB. The data.json (admin-edited content) has zero mentions of `impressum`, `datenschutz`, `privacy`, `cookie`, `gdpr`, `agb`, `tos`, `terms`.
- **Tracking:** Google Analytics (`gtag.js` via `googletagmanager.com`, GA ID visible in HTML). CSP allow-lists `*.google-analytics.com` and `googletagmanager.com`.
- **Cookie banner:** ❌ none — GA loads on page open without prior consent.
- **Set-Cookie headers (server-side):** none from CloudFront on initial fetch (cookies set client-side by GA).

### studio.palavara.com (studio site, palavara-v3)

- **Impressum:** ✅ exists at `/impressum` — `texts/impressum.md`, 16 lines. § 5 TMG basics present (name, address, email, responsible person per § 55 RStV). **No phone number** (email-only — borderline legal, see Issue L1 below).
- **Datenschutzerklärung:** ⚠️ exists at `/datenschutzerklaerung` — `texts/datenschutz.md`, 57 lines. Content is **materially out of date** — see Issues C1–C3 below.
- **AGB:** ⚠️ exists at `/agb` — `texts/agb.md`, 49 lines. Stand: January 2026. Out of date for the new online booking flow — see Issue C4.
- **Tracking:** Google Analytics loaded (`gtag.js`, GA ID `G-WEFKKD2KC8`).
- **Cookie banner:** ❌ none.
- **Footer links to legal pages:** SPA renders post-JS so I can't see the footer in raw HTML; need to inspect rendered page in a browser to confirm. Likely linked given the routes exist. Verify visually.

### book.palavara.com (booking page, scheduler/frontend)

- **Impressum / Datenschutz / AGB links:** ❌ none. The page has no legal disclosures at all. This is the surface that **collects PII (name, email) and triggers payment**, so the absence is the loudest issue in the audit.
- **Tracking:** none.
- **Cookies:** none server-side. App stores no admin-style state on the booking page (only the admin app uses localStorage).

### Confirmation / cancellation emails (`scheduler/backend/src/utils/email.js`)

- **Footer:** just `Palavara Studio` and `Booking ID: <uuid>`. No Impressum link, no street address, no opt-out / unsubscribe-equivalent disclosure. Transactional so opt-out doesn't strictly apply, but Impressum reference is expected on commercial email per § 5 TMG.

### data.palavara.com/admin/v2/ (admin tool)

- **Impressum etc.:** N/A — auth-gated, internal tool, not public-facing.
- One privacy concern: localStorage stores the admin password (under `palavara_admin_key`). Acceptable on a personal device but technically bad practice if the admin device is shared. Out of scope for this audit but flag for awareness.

---

## Critical issues — block live PayPal cutover

### C1 — Datenschutzerklärung: false claim "Diese Website verwendet keine Cookies"

`texts/datenschutz.md` line 33 says the site uses **no cookies**. That's incorrect: Google Analytics loads `gtag.js` which sets cookies (`_ga`, `_gid`, etc.) on page open. Stating "no cookies" while loading GA is the kind of contradiction that a) an automated scanner can detect, b) a dispute would surface immediately.

**Fix path:** rewrite section 4. Either:
- (a) State which cookies are set, by whom, for what purpose, lifetime, and add a consent banner so the statement is accurate.
- (b) Remove GA from both sites entirely and keep the "no cookies" claim. Switching to a cookieless analytics like Plausible self-hosted is a middle option.

### C2 — Datenschutzerklärung: false claim "Eine Weitergabe... an Dritte erfolgt nicht"

`texts/datenschutz.md` lines 35–37 say no data is shared with third parties except to fulfil the request. That's incorrect — the system actively shares with:

| Third party | What flows to them | Why |
|---|---|---|
| **Google (Analytics)** | IP, user-agent, page views, GA cookie ID | Site analytics on both palavara.com + studio.palavara.com |
| **Google (Calendar)** | Booking date/time, student name, student email, location, booking ID | Auto-sync to studio's Google Calendar (PR #115) |
| **PayPal** | Buyer name, email, payment amount (€95), booking-id reference | Payment processing on book.palavara.com |
| **AWS** (acting under DPA) | All booking PII at rest in DynamoDB; emails relayed via SES; static files in S3; CDN logs in CloudFront | Hosting + email delivery |

**Fix path:** rewrite section 5. List each processor by name, role (Auftragsverarbeiter), data flowing to them, and legal basis (typically Art. 6(1)(b) GDPR for booking processors and Art. 6(1)(a) consent for analytics).

### C3 — Datenschutzerklärung: doesn't describe the booking flow at all

`texts/datenschutz.md` § 2 says "Personenbezogene Daten werden nur erhoben, wenn Sie mir diese freiwillig mitteilen, z. B.: per E-Mail / im Rahmen einer Anfrage oder Buchung." Written for the **email-based** booking the studio used to have — predates the online booking system entirely.

What's actually collected now and not disclosed:
- Name, email captured by `book.palavara.com` form
- Stored in DynamoDB (eu-central-1) with `bookingId`, payment refs, status
- Booking metadata is also in PayPal, Google Calendar, SES email logs
- IP via CloudFront access logs
- Possibly Sentry crash data on the studio site (need to verify)

**Fix path:** § 2 needs a "Buchung von Workshops über studio.palavara.com" subsection covering: data captured, where stored, how long, processors involved, legal basis.

### C4 — AGB: outdated booking + payment description

`texts/agb.md`:
- § 2: "Die Anmeldung zu Workshops... erfolgt **ausschließlich per E-Mail**" — wrong, online booking exists at book.palavara.com.
- § 3: "Die Bezahlung erfolgt **vor Ort in bar oder per PayPal**" — wrong, payment is now upfront online via PayPal.
- § 4: "kostenfreie Stornierung bis 48 Stunden vor dem Termin" — ✅ this matches the implemented refund policy (`scheduler/backend/src/utils/cancelLogic.js`, `REFUND_WINDOW_MS = 48h`).

**Fix path:** rewrite § 2 + § 3 to reflect the current flow. § 4 stays as is.

### C5 — book.palavara.com has no Impressum / Datenschutz / AGB references

The single most important compliance gap. § 5 TMG requires an Impressum to be **easily reachable** from every page of a commercial online service. The booking page collects PII and triggers payment with zero legal disclosures linked.

Implementation:
- Footer on `index.html` and `confirm.html` with three links: Impressum, Datenschutz, AGB. Easiest is to point them at `https://studio.palavara.com/impressum` etc., not duplicate the content here.
- Optionally a one-line "By clicking Book & Pay, you agree to our [AGB] and [Datenschutzerklärung]" near the submit button.
- Cancellation policy already implicit on the cancel link footer copy in confirmation emails — but ALSO need it visible **before** payment on the booking form itself, not just post-booking.

### C6 — palavara.com (artist site) has no Impressum at all

The artist site is also a commercial offering (links to Etsy shop) and § 5 TMG applies just as much. There's no `/impressum` route, no Datenschutz, no AGB.

**Fix path:** add an `/impressum` route + a `/datenschutzerklaerung` route. Simplest is to have them point to (or reuse content from) the studio site's pages, given Varvara is the same person. Then add footer links from every page.

---

## Medium issues

### M1 — Email footers lack Impressum reference

Both customer and owner emails end with `Palavara Studio` + booking ID. § 6 TMG (Sondervorschriften für kommerzielle Kommunikation) applies to commercial email. Add a small footer block: studio name, address, contact, link to Impressum. Once per email. Easy edit in `scheduler/backend/src/utils/email.js`.

### M2 — No data-retention policy / implementation

DynamoDB bookings stay forever. GDPR Art. 5(1)(e) "storage limitation" requires a defined retention period and deletion thereafter. Suggested: 24 months after the workshop date, then auto-purge. DynamoDB TTL natively supports this — set a `ttl` attribute on each booking row equal to `(workshopDate + 24 months)` in unix-seconds.

Document the retention period in the Datenschutzerklärung § 6 (currently vague: "so lange... wie erforderlich").

### M3 — No documented right-to-erasure procedure

GDPR Art. 17 gives data subjects the right to request deletion. Currently no admin endpoint or process — would have to manually `aws dynamodb delete-item` per request. Not a code blocker but should be documented (in Datenschutz § 7) and ideally automated as a small admin endpoint or a button in the admin v2 UI.

---

## Low / hygiene

### L1 — Impressum has no phone number

§ 5 TMG requires "Angaben, die eine schnelle elektronische Kontaktaufnahme und unmittelbare Kommunikation ermöglichen" — typically interpreted as email + phone. Email-only is widely tolerated but a phone number is the safer reading.

### L2 — "Stand: Januar 2026" date stamps are now misleading

Both Datenschutz and AGB show "Stand: Januar 2026" but the underlying landscape (booking system, PayPal, Google Calendar, email automation) all changed in May 2026. Bump the date when content is updated.

---

## Suggested order of operations

The cheapest win is to do C1–C4 (text edits) first since the studio site already has the routes:

1. **Rewrite the three texts** (`texts/datenschutz.md`, `texts/agb.md`, leave `impressum.md` alone or add phone): align with current architecture. ~1 sitting with a translator / legal advisor.
2. **Add cookie consent banner OR remove GA**: pick one. If removing GA, delete the `gtag` snippets from `studio.palavara.com` + `palavara.com`. If keeping GA, integrate a German-compliant consent banner (Klaro or Cookiebot are the usual picks) — needs separate UX design.
3. **C5 — Add Impressum/Datenschutz/AGB links to book.palavara.com footer.** ~10 min code change in `scheduler/frontend/index.html` + `confirm.html` + `cancel.html`. Point at the studio site's pages.
4. **C6 — Add Impressum to palavara.com.** Either replicate the studio's content under palavara-front-v1 or just link to studio's pages from a tiny new `/impressum` route.
5. **M1 — Email footer Impressum.** ~5 min in `email.js`.
6. **M2 — Retention.** Add `ttl` attribute on new bookings; backfill with a script. ~1 hour.
7. **M3 — Erasure procedure.** Document in Datenschutz; defer the admin endpoint until first real request comes in.

L1 + L2 are nice-to-have once you're already editing the texts.

---

## Files to inspect by hand before live cutover

- `texts/datenschutz.md` — main rewrite
- `texts/agb.md` — sections 2, 3, 9
- `texts/impressum.md` — consider adding phone
- `scheduler/frontend/index.html`, `confirm.html`, `cancel.html` — add legal-link footer
- `scheduler/backend/src/utils/email.js` — add Impressum block to footer of both student-facing and owner-facing emails
- `scheduler/backend/src/handlers/createBooking.js`, `adminCreateBooking.js` — set `ttl` attribute on item write
- `scheduler/template.yaml` — enable `TimeToLiveSpecification` on `BookingsTable` if pursuing M2

---

## What I did NOT inspect

- Sentry data — couldn't verify what's actually being captured in production. Would matter for the Datenschutz § 5 third-party list. Worth a five-minute look at Sentry's project settings (PII scrubbing, IP tracking).
- The exact rendered footer of studio.palavara.com (whether legal links are visually present in the SPA's footer). Worth a manual eyeball in a browser before declaring C5 fully scoped.
- Hosting jurisdiction nuance — AWS eu-central-1 (Frankfurt) keeps everything in the EU which simplifies the GDPR third-country-transfer question. Worth noting in Datenschutz § 5.
- The artist site's `data.palavara.com` admin (palavara-admin) — auth-gated, but worth confirming the password isn't being sent in plaintext anywhere insecure.
