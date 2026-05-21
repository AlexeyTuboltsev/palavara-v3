# Palavara SEO Plan

Started: 2026-04-18

## What shipped

| PR | What |
| --- | --- |
| #64 | Fixed title, OG typo, added sitemap.xml, canonical URL, LocalBusiness JSON-LD |
| #65 | GA4 event tracking (page_view on route change, email_click, outbound_click, language_change) |
| #66 | Per-page titles, descriptions and canonicals (`react-helmet-async`) |
| #67 | Descriptive alt text on all route images |
| #68 | Fixed GA4 measurement ID — studio.palavara.com now reports to the palavara.com property (was going to an Etsy property) |

Google side:
- Search Console: `studio.palavara.com` URL-prefix property verified (via DNS, inherited from the palavara.com Domain property). Sitemap submitted, 16 pages discovered.
- Business Profile: categories set (Pottery classes primary, Art studio, Ceramic manufacturer, Art gallery — one still pending Google review), website, hours, description and photos in place.

## Check-in schedule

### Tomorrow — 2026-04-19 (+1 day)
- [ ] **GA4** → Admin → Events. Look for `email_click` and `outbound_click`. Toggle **"Mark as key event"** on each. They only appear after real traffic triggers them post-deploy, so need 24h.
- [ ] **Business Profile** → confirm the "Pending" category got approved.

### 2026-04-25 (+1 week)
- [ ] **Search Console** → Indexing → Pages. How many of the 16 routes are "Indexed" vs "Not indexed"? Anything under "Discovered - currently not indexed" more than a week old should be looked at.
- [ ] **Search Console** → Performance → Queries. Any queries showing up yet? Note the top 5.
- [ ] Sanity check: paste `https://studio.palavara.com/membership` into Facebook/WhatsApp and see whether the link preview shows the per-page title or the generic homepage one. If generic → prerendering becomes higher priority.

### 2026-05-18 (+1 month)
- [ ] **Search Console** → Performance: top queries, top pages, overall clicks and impressions.
- [ ] **GA4** → Reports → Engagement → Events: counts of `email_click` and `outbound_click`. Which pages generate them?
- [ ] **Decide on prerendering** based on 1-week link-preview check.
- [ ] **Reviews**: how many Google reviews are on the Business Profile? Aim for 10+ by month 3.

### 2026-07-18 (+3 months)
- [ ] Search Console rankings for: `pottery Berlin`, `Töpferkurs Berlin`, `ceramics classes Berlin`, `Töpfern Berlin Wedding`, `Palavara`.
- [ ] Maps ranking check (incognito): search `pottery Berlin` — is Palavara in the 3-pack?
- [ ] Reviews count.
- [ ] Decide on next round: content expansion, `hreflang` + RU content, prerendering if still pending.

## Still on the code-side backlog

(Not blocking anything — do when convenient.)

- **Prerendering** — so Facebook/WhatsApp/Slack/Bing see the per-page OG tags. Discussed react-snap (unmaintained) vs. a custom script reusing the existing Playwright Docker image (~2h of work).
- **Written content expansion** on service pages (currently short). Biggest remaining organic-search lever.
- **hreflang + Russian translations** for the RU variant to rank in Russian search.
- **404 page** (no catch-all currently — invalid URLs render nothing).
- **Lazy-loaded routes** (`React.lazy`) — smaller initial bundle, faster Core Web Vitals.

## Other off-page stuff (my action, not code)

- **Collect Google reviews** — single biggest Maps ranking factor. Send the review share link to happy students after class.
- **Instagram cross-linking** — keep posting, tag location, link studio.palavara.com in bio.
- **Backlinks** — Berlin expat blogs, mommy/kids activity sites, event listings. Each relevant link is a ranking signal.

## Using this file with Claude

Next time you open a session, ask things like:
- "What am I checking today per SEO_PLAN.md?"
- "Walk me through the 1-week check-in."
- "Let's do the next code PR from the backlog."

All dates are absolute so they won't drift.
