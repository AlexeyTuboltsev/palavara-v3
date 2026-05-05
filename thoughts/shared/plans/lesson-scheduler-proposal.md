# Lesson Scheduler — Implementation Proposal

**Date:** 2025-04-15  
**Project:** Palavara v3 (`studio.palavara.com`)  
**Scope:** Calendly-style lesson booking with integrated payment

---

## 1. Current State

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (Create React App) |
| State management | Redux Toolkit + Redux Saga |
| Routing | Custom client-side router (`src/router.ts`) |
| Styling | SASS modules (`.module.scss`) |
| Testing | Jest (unit) + Playwright (visual regression) |
| Deployment | AWS S3 (`studio.palavara.com`) + CloudFront (eu-central-1) |
| i18n | i18next (EN/DE detection in place) |
| Error tracking | Sentry |

### What Exists Today
- **Pure static SPA** — no backend, no database, no server-side code
- **No authentication** — students cannot log in or create accounts
- **No payment processing** — zero payment infrastructure
- **Email-only booking** — every bookable service ends with a `mailto:` link:
  - Kids Class: `palavarastudio+kp@gmail.com`
  - Wheel Throwing: `varya@palavara.com`
  - Everything else: `palavarastudio@gmail.com`

### Bookable Services (from existing routes)
| Service | Format | Price | Schedule |
|---------|--------|-------|----------|
| Kids Class | 4-lesson block or single trial | €80 / €20 | Wednesdays 16:30–18:00 |
| Wheel Throwing (group) | 4-session course, max 3 people | €250/person | Various (not fixed) |
| Wheel Throwing (private) | 4-session course | €365 | Various |
| Wheel Throwing (group 1x) | One-time group workshop | TBD | Various |
| Wheel Throwing (private 1x) | One-time private workshop | TBD | Various |
| Team Events / Birthday Parties / Family Saturday | Group bookings | TBD | On request |
| Rent a Space | Flexible studio hire | TBD | TBD |

---

## 2. Requirements

### 2.1 Teacher Availability Management
- Define **weekly recurring availability** per service type (e.g., "Kids Class runs every Wednesday 16:30–18:00")
- Set a **class capacity** per slot (e.g., Kids Class: max 8 students; Wheel Throwing group: max 3)
- Mark **exception dates** (school holidays, studio closures, vacations) where slots are unavailable
- Add **custom one-off slots** for workshops that don't follow a weekly pattern
- **Admin interface** (simple password-protected page or separate admin URL)

### 2.2 Student Booking Flow
1. Student visits service page (e.g., `/kids-class`)
2. "Book Now" button reveals a **calendar date picker** showing available slots
3. Student selects a date → sees available time slots
4. Student fills in: name, email, number of participants (where applicable)
5. Student proceeds to **payment** — pay at booking time
6. On successful payment: booking is confirmed, slot is marked taken
7. Student receives **confirmation email**

### 2.3 Payment Integration
- **PayPal Checkout Standard** (hosted page) for PCI-compliant payment processing
- Simplest possible integration: student is redirected to a PayPal-hosted payment page; no card data touches our server
- Fee: **2.49% + €0.35 per EU transaction** (deducted from each payment; no monthly fee)
- Payment happens **at booking time** (no pay-later)
- PayPal IPN (Instant Payment Notification) or return URL confirms payment success and triggers booking confirmation
- No server-side secret key required for basic Checkout Standard — redirect parameters are assembled in Lambda

### 2.4 Email Notifications
- **Booking confirmation** to student: service name, date/time, price paid, location
- **New booking notification** to studio: same info + student contact details
- **Reminder email** 24–48h before the lesson
- **Cancellation email** if teacher cancels or reschedules

### 2.5 Cancellation & Rescheduling Policy
- Current policy (from site copy): "If you for any reason miss a class, unfortunately we will not be able to reimburse you."
- This needs a formal policy decision:
  - Does the student get a refund if they cancel 48h+ in advance?
  - Can a student reschedule to another available slot?
  - PayPal supports refunds via API but someone must decide under what conditions

---

## 3. Proposed Architecture

### 3.1 Overview
Since the frontend is a pure static SPA on AWS, the natural fit is a **serverless backend on the same AWS account** — Lambda + API Gateway + DynamoDB + SES. No new infrastructure vendor needed. **Total infrastructure cost: $0/month** (all services remain within AWS free tier at this scale).

```
Browser (React SPA on S3/CloudFront)
    ↓ HTTPS API calls
Amazon API Gateway
    ↓ invokes
AWS Lambda (Node.js functions)
    ↓                          ↓
Amazon DynamoDB           PayPal Checkout Standard
(eu-central-1)            (hosted payment page)
    ↓                          ↓
Amazon SES             PayPal IPN / return URL
(transactional email)   → Lambda → DynamoDB + SES
```

**Payment flow detail:**
1. Student submits booking form → Lambda creates a `pending_payment` booking in DynamoDB
2. Lambda assembles a PayPal Checkout redirect URL (with amount, item name, return/cancel URLs, booking ID in `custom` field)
3. Student is redirected to PayPal's hosted page → pays there
4. On success, PayPal redirects back to `/booking/:id` (return URL) — Lambda marks booking `confirmed`
5. PayPal also sends an IPN POST to `/webhooks/paypal` as a server-side backup confirmation

### 3.2 Data Models (DynamoDB)

DynamoDB uses a single-table design. Primary key: `PK` + `SK`.

#### Availability Rules — recurring weekly slots
```
PK: AVAIL_RULE
SK: {serviceType}#{ruleId}

Attributes:
  ruleId           String (UUID)
  serviceType      String (kids_class | wheel_throwing_group | wheel_throwing_private | ...)
  dayOfWeek        Number (0=Sun…6=Sat)
  startTime        String (e.g., "16:30")
  endTime          String (e.g., "18:00")
  capacity         Number
  active           Boolean
  timezone         String (default: "Europe/Berlin")
  validFrom        String (ISO date)
  validUntil       String (ISO date, optional)
```

#### Availability Exceptions — closures / holidays
```
PK: EXCEPTION
SK: {date}#{exceptionId}

Attributes:
  exceptionId      String (UUID)
  exceptionDate    String (ISO date)
  reason           String (optional, e.g., "School holidays Berlin")
  serviceType      String (optional, NULL = applies to all services)
```

#### Slots
Slots are **computed at read time** from availability rules minus exceptions minus already-booked bookings. Nothing is stored for slots.

#### Bookings
```
PK: BOOKING
SK: {bookingId}

GSI1PK: {serviceType}#{slotDate}   (to query bookings by service+date)
GSI2PK: {studentEmail}              (to look up a student's bookings)

Attributes:
  bookingId           String (UUID)
  serviceType         String
  slotDate            String (ISO date)
  slotStartTime       String
  slotEndTime         String
  status              String (pending_payment | confirmed | cancelled | no_show)
  studentName         String
  studentEmail        String
  participantCount    Number (default 1)
  paypalCustomField   String (booking ID echoed back by PayPal)
  paypalTransactionId String (optional, from IPN)
  amountPaidCents     Number (optional)
  languagePref        String (en | de | ru)
  createdAt           String (ISO timestamp)
  confirmedAt         String (ISO timestamp, optional)
  cancelledAt         String (ISO timestamp, optional)
```

### 3.3 API Endpoints (Lambda via API Gateway)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/availability/{serviceType}?from=YYYY-MM-DD&to=YYYY-MM-DD` | Returns available slots in range |
| POST | `/bookings` | Create a pending booking + return PayPal redirect URL |
| GET | `/bookings/{id}` | Get booking status (for post-payment confirmation page) |
| POST | `/bookings/{id}/confirm` | Called on PayPal return URL; marks booking confirmed |
| POST | `/webhooks/paypal` | PayPal IPN receiver (backup server-side confirmation) |
| POST | `/admin/availability` | *(protected)* Create/update availability rule |
| POST | `/admin/exceptions` | *(protected)* Add exception date |
| GET | `/admin/bookings` | *(protected)* List all bookings |

### 3.4 Frontend Changes

#### New Routes to Add
```typescript
// src/router.ts additions
BOOK_KIDS_CLASS = "bookKidsClass"          // /book/kids-class
BOOK_WHEEL_THROWING = "bookWheelThrowing"  // /book/wheel-throwing
BOOKING_CONFIRMATION = "bookingConfirmation" // /booking/:id
```

#### New React Components
- `<SlotPicker>` — calendar UI to browse available dates
- `<SlotList>` — shows time slots for a selected date
- `<BookingForm>` — name, email, participant count, language preference
- `<BookingConfirmation>` — post-payment success/failure page
- API service layer: `src/services/bookingApi.ts` (wraps axios calls to Lambda endpoints)

#### State Management
- New Redux slice for booking state: `src/store/bookingSlice.ts`
- New sagas: `src/sagas/bookingSaga.ts`

### 3.5 Backend Infrastructure (new, in `infra/`)
- **AWS SAM** or **Serverless Framework** config for Lambda + API Gateway
- **Amazon DynamoDB** (on-demand mode, eu-central-1) — **$0/month** at this scale (well within free tier: 25 GB storage, 25 WCU/RCU free; this workload uses a tiny fraction)
- **Amazon SES** for transactional email (`noreply@palavara.com`) — **$0/month** for < 62,000 emails/month when sent from EC2/Lambda
- **PayPal Checkout Standard** — **no monthly fee**; PayPal deducts **2.49% + €0.35** per EU transaction at the time of payment
- **Total monthly infrastructure cost: $0**

---

## 4. Phased Implementation Plan

### Phase 1 — Basic Availability + Booking (no payment) ✦ Smallest useful increment

**Goal:** A working booking flow where the teacher defines slots and students can book them; payment is handled manually (e.g., bank transfer). Students get a booking ID and pay before the class.

**Work:**
1. Set up AWS SAM project in `infra/scheduler/`
2. Create DynamoDB table with single-table design + GSIs
3. Lambda functions: `GET /availability`, `POST /bookings` (creates booking with status `pending_payment`)
4. Admin Lambda: simple API-key-protected `POST /admin/availability` + `POST /admin/exceptions`
5. Frontend: add `<SlotPicker>` + `<BookingForm>` to Kids Class page behind an expandable section
6. Add `BOOKING_CONFIRMATION` route showing "Your booking is received, please pay via bank transfer before your class"
7. Email (SES): notify teacher of new booking; send student a "booking received" email

**Does NOT include:** Online payment, reminder emails, cancellation, rescheduling

**Outcome:** Teacher can configure Kids Class slots; students can book a slot online; teacher gets notified. Works immediately with zero payment risk. Validates the UX before adding PayPal integration.

---

### Phase 2 — PayPal Payment Integration

**Goal:** Students pay at booking time via PayPal; booking only confirmed on successful payment.

**Work:**
1. Register/configure PayPal Business account, enable IPN, note client ID + merchant email
2. Lambda: `POST /bookings` returns a PayPal Checkout redirect URL (amount, item description, `custom=bookingId`, return/cancel URLs)
3. Frontend: after form submission, redirect browser to PayPal-hosted payment page
4. Lambda: `POST /bookings/{id}/confirm` — called when PayPal redirects back; verifies payment via PayPal API, marks booking `confirmed`, triggers confirmation email
5. Lambda: `POST /webhooks/paypal` — IPN endpoint as server-side backup; validates IPN with PayPal, marks booking `confirmed` if not already done
6. Lambda: handle cancelled PayPal payments (cancel URL) → mark booking slot available again after a timeout
7. `<BookingConfirmation>` page polls `GET /bookings/{id}` to show confirmed vs. pending vs. cancelled

**Transaction fee reminder:** PayPal deducts **2.49% + €0.35** per EU transaction. No code change needed — this is handled entirely on PayPal's side.

**Outcome:** Fully automated "book and pay" flow. No manual payment chasing.

---

### Phase 3 — Email Notifications

**Goal:** Automated student emails for every lifecycle event.

**Work:**
1. Set up SES with `noreply@palavara.com` or `bookings@palavara.com`
2. Email templates (HTML + text, EN/DE/RU based on language preference):
   - **Booking confirmed**: date, time, location, Google Maps link, what to bring
   - **Reminder**: sent 48h before class via EventBridge Scheduled Rule → Lambda
   - **Teacher new booking alert**: student name, contact, class details
3. Implement reminder scheduler: EventBridge rule fires daily; Lambda queries bookings happening in 48h; sends reminder
4. Handle unsubscribe / bounce handling (SES bounce notifications)

**Outcome:** Professional automated communication. Reduces teacher's manual work.

---

### Phase 4 — Cancellation & Rescheduling

**Goal:** Self-service cancellation with configurable refund policy; optional rescheduling.

**Work:**
1. Decide and document the cancellation policy (see Open Questions below)
2. Lambda: `POST /bookings/{id}/cancel` — validates policy window, calls PayPal Refund API if eligible, marks booking `cancelled`, frees slot
3. Lambda: `POST /bookings/{id}/reschedule` — cancel + rebook in one atomic operation
4. Frontend: add cancellation link in confirmation email (signed URL with token, valid 48h before class)
5. Admin: `POST /admin/bookings/{id}/cancel` — teacher-initiated cancellation with full refund + notification to student

**Outcome:** Students can self-serve; reduces teacher admin. Handles no-shows and holidays gracefully.

---

## 5. Open Questions (Needs Owner Input)

These must be answered before or during Phase 1:

### Booking & Pricing
1. **Which services to schedule first?** Just Kids Class, or Wheel Throwing too? The data model can handle both, but the UI scope affects Phase 1 timeline.
2. **Trial class (€20) vs. 4-pack (€80)** — should the student choose when booking, or is the trial a separate booking type?
3. **Group size limits** — Kids Class: what is the maximum students per slot? (Currently "limited places available")
4. **Wheel Throwing group booking** — does a student book a single spot in an existing course, or must they book all 4 sessions as a package?

### Payment & Refunds
5. **Cancellation policy** — the site currently says "no refunds." Will this change if students book online? A common approach: full refund if cancelled 7+ days out; no refund within 7 days.
6. **Deposit vs. full payment** — take full payment upfront, or a deposit?
7. **Manual payment fallback** — is Phase 1 (booking without online payment) acceptable as a first go-live?
8. **PayPal account** — does a PayPal Business account already exist under `varya@palavara.com` or `palavarastudio@gmail.com`, or does one need to be created?

### Operations
9. **How many new slots per week?** (Affects whether simple recurring rules or a full calendar editor is needed)
10. **School holiday blocking** — should the system automatically block Berlin school holidays, or is manual exception-adding fine?
11. **Teacher notification** — should the notification go to `varya@palavara.com`, `palavarastudio@gmail.com`, or both?
12. **Language of student emails** — EN only, or also DE? (The site is EN-only currently, German legal pages notwithstanding)
13. **GDPR / data retention** — student name + email will be stored in DynamoDB. How long to retain booking records? (EU GDPR requires a stated retention policy; DynamoDB TTL can auto-delete old records)

### Infrastructure
14. **New subdomain?** API could live at `api.palavara.com` or `be.palavara.com/api`. The `be.palavara.com` domain already exists (used for images) — could reuse or keep separate.
15. **Admin interface** — a locked URL on the main site (e.g., `/admin` with a password prompt), a separate simple admin app, or just direct API calls (curl/Postman) to start?

---

## 6. Recommended Starting Point

**Start with Phase 1, scoped to Kids Class only.**

Rationale:
- Kids Class has the most predictable schedule (every Wednesday, fixed time)
- Lowest complexity: one session type, fixed price, single slot per booking
- Validates the booking flow end-to-end before adding payment complexity
- Delivers real value immediately (removes the email back-and-forth for Kids Class)
- **Zero infrastructure cost** — DynamoDB + Lambda + SES all remain within AWS free tier
- Total implementation estimate for Phase 1: ~2–3 weeks of focused work

---

## 7. Cost Summary

| Component | Cost |
|-----------|------|
| AWS Lambda | $0/month (free tier: 1M requests/month) |
| Amazon API Gateway | $0/month (free tier: 1M calls/month) |
| Amazon DynamoDB | $0/month (free tier: 25 GB + 25 WCU/RCU) |
| Amazon SES | $0/month (< 62,000 emails/month from Lambda) |
| Amazon S3 / CloudFront | $0/month (already in use, negligible additions) |
| PayPal Checkout Standard | $0/month fixed; **2.49% + €0.35 per EU transaction** |
| **Total monthly fixed cost** | **$0** |

Example transaction fees (PayPal):
- €20 trial class → PayPal fee: ~€0.85 → studio receives ~€19.15
- €80 kids pack → PayPal fee: ~€2.34 → studio receives ~€77.66
- €250 wheel throwing → PayPal fee: ~€6.58 → studio receives ~€243.42

---

*Proposal written: 2025-04-15*  
*Updated: 2025-04-15 — Database: DynamoDB (free tier); Payment: PayPal Checkout Standard only*
