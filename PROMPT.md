# PROMPT.md — Master Build Specification
## DataExchange · Personal Data Exchange Platform
### Fortune-grade product strategy · Premium motion-rich UI/UX · Clickable PWA MVP · Production-ready architecture

> **How to use this file:** It is the source of truth for *what* to build. `CLAUDE.md` holds the standing rules for *how* to work in this repo, and its security invariants override anything here. Build in the phase order in §18, verifying each phase's acceptance criteria before moving on.

---

## 0. Your role

Act as an accountable, cross-functional product team:

- Principal Product Manager / Product Owner
- Top 1% Product Designer, UX Architect, and Motion Designer
- Principal Frontend Engineer (Next.js, TypeScript)
- Senior Backend Engineer (NestJS, PostgreSQL)
- Application Security and Privacy Engineer
- QA Automation Engineer
- DevOps and Cloud Architect

Deliver **working software**, not mock screens. Challenge unnecessary complexity, protect the core value (explicit, field-level consent), and leave the codebase ready to grow into a commercial SaaS.

This is a product concept and MVP. Make no claims of patentability, regulatory certification, verified identity, or guaranteed commercial success.

---

## 1. Product vision

**Enter once. Share anywhere.**

People retype their name, phone, email, and address at every business. That causes friction, typos, and wasted staff time. DataExchange lets a person keep one profile and share **only the fields they approve**, for a **clearly stated purpose**, with an **identified organization**.

**Two sharing channels:**

| Channel | Business does | Customer does |
|---|---|---|
| **In person (QR)** | Shows a QR generated from a backend session | Scans it in the PWA |
| **Phone / remote (share code)** | Reads a short-lived one-time code aloud | Types it into the PWA |

In both channels the customer reviews organization, purpose, and fields, then selects optional fields and approves or declines. Only approved fields reach the authenticated business, which can save them as a customer record.

**Principles:**
- Privacy first, with minimum necessary data
- Explicit, understandable, field-level consent
- Transparent organization identity and purpose
- Secure, short-lived, single-use sessions
- No app install required (PWA), and no wallet dependency
- No reuse of data beyond the consented purpose
- Accessible and mobile-first
- Honest trust signals only

---

## 2. Objectives

**Business user can:**
1. Sign in.
2. Create or join an organization.
3. Create a request with name, purpose, and fields, marking each field required or optional.
4. Choose QR or share code.
5. Present it.
6. Watch live status.
7. Receive only approved fields.
8. Save them to customer records.
9. View consent details and audit history.
10. Search customers.
11. Manage team and settings.

**Customer can:**
1. Open the PWA.
2. Sign in with Google or mobile OTP.
3. Maintain a profile.
4. Scan a QR or enter a code.
5. Review the organization and purpose.
6. See exact fields, with required and optional marked.
7. Choose optional fields.
8. Approve or decline.
9. Get a receipt.
10. Review history.
11. Manage profile, privacy, and account deletion.

---

## 3. Reference design mapping

The attached reference board defines layout, hierarchy, and tone. Match it closely, with the deviations below, which are **mandatory** because the board conflicts with MVP privacy scope.

### 3.1 What to replicate

**Business portal (top row, left to right):**
1. **Login card.** DataExchange logo above "Business Portal". "Welcome back!" with Continue with Google and Continue with mobile number buttons, an "or" divider, and a "Create a business account" link. A soft illustrated city skyline at the bottom.
2. **Dashboard.** Dark navy left sidebar with logo, org switcher ("Maple Grove Properties"), and nav: Dashboard, Create Request, Requests, Received Data, Customers, Team, Settings. Four stat cards (Total, Completed, Pending, Declined) with period deltas. A "Last 7 days" range select. A Recent Requests list with icon, name, time, and status pill.
3. **Create request, step 1.** A 3-step stepper (Details → Select Fields → Share Method). Fields for request name, a purpose select or combobox, and optional notes with a 0/200 counter. Cancel and Next → buttons.
4. **Select fields.** Category tabs, a checkbox list with icon, label, and category, and Back and Next buttons.
5. **Sharing method.** A segmented choice between "QR Code (in-person sharing)" and "Share Code (phone call / remote)". A QR card in a teal frame with a "Request expires in 15 minutes" pill, Copy Link, and New QR Code. An "OR" section for the one-time share code, shown large as **482 917** with a copy icon, "Expires in 5 minutes", and Generate New Code.
6. **Received information.** A "Completed" pill and timestamp. A customer card with avatar, name, and approved fields. Consent Details: purpose, approved at, and shared-field chips. Download and **Save to Customer Record** buttons. A success toast reading "Information saved successfully".

**Customer PWA (bottom):**
- **Login.** Logo, "Enter once. Share anywhere.", Google and mobile buttons, and a create-account link, with a friendly illustration.
- **Mobile number** (+91 default with a flag) and Send OTP. **Verify OTP** with six digit boxes, "Resend OTP (00:30)", and Continue.
- **2A QR flow:** Scanner (dark camera view, corner viewfinder, "Enter code instead") → Request review (org cover, org name, request card with purpose, timestamp, expiry, "Learn more about this business", Continue and Decline) → Select information (toggles per field with masked values, "Not shared" for off) → Confirm and share ("You're in control…", field list, consent note, Share Information and Go back) → Success (animated check with particle dots, Done and View activity).
- **2B phone flow:** Enter share code (six boxes, "Expires in 5 minutes", Continue) → the same review, select, confirm, and success screens.
- Tagline chip: "Your data. Your choice. Greater privacy."

### 3.2 Mandatory deviations from the board

| Board shows | MVP does instead | Why |
|---|---|---|
| Date of birth, Emergency contact, Government ID, Driver's licence fields | **Not offered.** The field picker shows only the allowlist (§7.2). Category tabs reduce to **Name · Contact · Address**. | Data minimisation. These are out of MVP scope. |
| Green shield next to "John Smith" | Shown only next to a **contact detail that was actually verified** (for example, a phone number verified by OTP), with tooltip "Phone number verified by one-time code". Never as an identity badge. | Honest trust signals. |
| "+20%", "+33%" deltas | Computed from real data against the previous equal period. Hidden when the previous period is zero. | No fake analytics. |
| Customer review screen implies business legitimacy | Show "Verified business" **only** if `organization.verifiedAt` is set by a real process. MVP shows "Business details provided by the organization". | Same as above. |
| "Download" on received data | Exports the consent receipt (PDF or JSON) containing **approved fields only**, and writes an audit event. | Accountability. |

---

## 4. Scope

**In MVP:** everything in §13 and §14. Two auth methods, profile, QR and code sessions, consent, receipts, live status, customer records, team roles, audit log, account deletion, PWA install, dev simulation mode, CI, and deploy docs.

**Out of MVP:** identity or business verification, payments, NFC, native apps, wallets, SDK or embeddable widget, webhooks, CRM integrations, multi-language (structure copy for i18n, ship English), DOB/ID/medical/emergency fields, Redis, microservices, and Kubernetes. List these in `docs/roadmap.md`.

---

## 5. Technology decisions

Use the stack in `CLAUDE.md` §2. Additional decisions:

- **Single Next.js app** with route groups `(customer)` and `(business)`. This gives one deploy and one design system, with different layouts per experience.
- **Auth: Clerk** as the default. It supports Google OIDC and phone OTP, has first-class Next.js integration, and its JWTs can be verified in NestJS via JWKS. Before committing, confirm **SMS OTP delivery coverage for India (+91)** and current pricing on the provider's site, and record the findings in `docs/adr/0001-auth-provider.md`. The documented fallback is Auth0 (Google + passwordless SMS). Abstract provider calls behind `AuthProvider` interfaces in both apps so a swap is contained.
  - The provider handles OTP generation, expiry, attempt limits, and SMS. Configure its protections (rate limits, bot protection) and document them.
  - The NestJS `AuthGuard` verifies the JWT (issuer, audience, expiry, signature via JWKS) and upserts a local `User` by provider subject.
  - **Dev mode (`AUTH_MODE=dev`):** a simulated sign-in page lists seeded synthetic users, and the API accepts locally signed dev JWTs. A persistent amber banner reads "Development simulation — not real authentication · synthetic data". The API refuses to boot in production with dev mode on.
- **Realtime:** SSE endpoint `GET /org/sessions/:id/events` streams status changes to the business screen. Fall back to TanStack Query polling every 3 s if SSE disconnects.
- **Rate limiting:** `@nestjs/throttler` with Postgres storage, plus domain counters (§9.3).
- **Encryption at rest:** managed Postgres encryption, plus application-level AES-256-GCM for `ConsentGrant.payload` (the snapshot of shared values). Keys come from env (`DATA_ENC_KEY`, versioned with a key id for rotation).
- **Motion:** `motion` package (§12).

Document every non-trivial choice as an ADR: context, decision, alternatives, consequences.

---

## 6. Architecture

Modular monolith (NestJS):

```
auth ─ users ─ profiles
organizations ─ memberships (roles) ─ invitations
sessions (create, QR token, share code, resolve, cancel, expire)
consent (decision, receipts, grants)
customer-records
audit
realtime (SSE)
health
```

- A scheduled expiry sweeper (`@nestjs/schedule`, every 30 s) marks `WAITING`/`IN_REVIEW` sessions past `expiresAt` as `EXPIRED`. Every read path **also** checks `expiresAt`, so correctness never depends on the sweeper.
- Swagger at `/docs`. OpenAPI types are generated into `packages/shared` or mirrored by Zod. Contracts must not drift.
- Security headers: Helmet on the API. CSP, HSTS, `Permissions-Policy: camera=(self)`, and frame-ancestors none on the web. CORS restricted to the web origin.

---

## 7. Domain model

### 7.1 Prisma sketch (refine, but keep the semantics)

```prisma
model User {
  id            String   @id @default(cuid())
  authSubject   String   @unique            // provider subject
  email         String?  @unique
  emailVerified Boolean  @default(false)
  phone         String?  @unique             // E.164
  phoneVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  deletedAt     DateTime?
  profile       CustomerProfile?
  memberships   Membership[]
}

model CustomerProfile {
  userId     String  @id
  firstName  String?
  lastName   String?
  email      String?
  phone      String?
  addressLine1 String?
  addressLine2 String?
  city       String?
  region     String?
  postalCode String?
  country    String?  // ISO-3166 alpha-2
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Organization {
  id         String   @id @default(cuid())
  name       String
  category   String
  contactEmail String?
  contactPhone String?
  logoUrl    String?
  verifiedAt DateTime?          // null in MVP unless a real process sets it
  isSample   Boolean  @default(false)
  createdAt  DateTime @default(now())
}

enum Role { OWNER ADMIN STAFF }
model Membership {
  id String @id @default(cuid())
  userId String
  organizationId String
  role Role
  @@unique([userId, organizationId])
}

enum ShareMethod { QR CODE }
enum SessionStatus { WAITING IN_REVIEW APPROVED DECLINED EXPIRED CANCELLED COMPLETED }

model ShareSession {
  id              String   @id @default(cuid())
  reference       String   @unique          // human-friendly, e.g. REQ-7K4M2
  organizationId  String
  createdById     String
  name            String
  purpose         String
  explanation     String?  @db.VarChar(200)
  method          ShareMethod
  status          SessionStatus @default(WAITING)
  qrTokenHash     String?  @unique
  codeHash        String?                     // HMAC; uniqueness among active codes enforced via partial unique index (raw SQL migration)
  expiresAt       DateTime
  customerId      String?                     // bound on first successful resolve
  boundAt         DateTime?
  decidedAt       DateTime?
  createdAt       DateTime @default(now())
  fields          RequestedField[]
  grant           ConsentGrant?
  @@index([organizationId, status, createdAt])
}

model RequestedField {
  sessionId String
  fieldKey  String      // validated against FIELD_CATALOG
  required  Boolean
  @@id([sessionId, fieldKey])
}

model ConsentGrant {
  id            String   @id @default(cuid())
  receiptId     String   @unique             // e.g. DX-7K4M-92QF
  sessionId     String   @unique
  customerId    String
  organizationId String
  decision      String                       // APPROVED | DECLINED
  approvedKeys  String[]
  requestedKeys String[]
  purposeSnapshot String
  orgNameSnapshot String
  consentTextVersion String
  payloadCipher Bytes?                        // AES-GCM snapshot of approved values (null if declined)
  payloadKeyId  String?
  createdAt     DateTime @default(now())
}

model CustomerRecord {
  id             String   @id @default(cuid())
  organizationId String
  sourceGrantId  String   @unique
  fullName       String?
  email          String?
  phone          String?
  address        Json?
  createdById    String
  createdAt      DateTime @default(now())
  @@index([organizationId, fullName])
  @@index([organizationId, email])
  @@index([organizationId, phone])
}

model AuditEvent {
  id         String   @id @default(cuid())
  at         DateTime @default(now())
  actorUserId String?
  organizationId String?
  sessionId  String?
  type       String      // SESSION_CREATED, CODE_REDEEM_FAILED, CONSENT_APPROVED, RECORD_SAVED, RECEIPT_EXPORTED, ...
  meta       Json        // never personal data values
  ipHash     String?
  @@index([organizationId, at])
}
```

### 7.2 Field allowlist (`packages/shared/src/fields.ts`)

| key | label | source | category | display mask (pre-consent preview to the customer only) |
|---|---|---|---|---|
| `FULL_NAME` | Full name | first + last | Name | shown in full to its owner |
| `MOBILE` | Mobile number | profile.phone | Contact | full to owner |
| `EMAIL` | Email address | profile.email | Contact | full to owner |
| `ADDRESS` | Postal address | address parts | Address | first line + city |

Any key not in this catalogue is rejected with `400 FIELD_NOT_ALLOWED` on create and on decision. Adding a field requires a catalogue entry, a validation schema, and an ADR justifying the use case.

### 7.3 Session status machine

```
WAITING ──resolve by customer──▶ IN_REVIEW ──approve──▶ APPROVED ──business saves record──▶ COMPLETED
   │                               │  └──decline──▶ DECLINED
   ├─cancel (business)─▶ CANCELLED ◀┘
   └─expiresAt passed─▶ EXPIRED (from WAITING or IN_REVIEW)
```

Terminal states: DECLINED, EXPIRED, CANCELLED, COMPLETED. APPROVED can only move to COMPLETED. The UI label for WAITING is "Waiting" and for IN_REVIEW is "Customer reviewing".

---

## 8. API surface (REST, `/v1`)

**Customer** (auth required):
- `GET /me`, `PATCH /me/profile`, `DELETE /me` (deletion workflow)
- `POST /share/resolve-token` `{ token }` → session metadata (org name, logo, purpose, explanation, fields with required flags, expiresAt). It binds the customer and sets IN_REVIEW.
- `POST /share/resolve-code` `{ code }` → same response. Rate limited (§9.3).
- `POST /share/sessions/:id/decision` `{ decision: "APPROVE"|"DECLINE", approvedKeys?, idempotencyKey }` → receipt
- `GET /me/activity`, `GET /me/activity/:grantId`

**Business** (auth + membership; org from the membership context header `X-Org-Id`, verified against memberships):
- `POST /org` (onboarding), `GET/PATCH /org`
- `GET /org/dashboard?range=7d` (computed metrics)
- `POST /org/sessions` → `{ session, qrUrl? , code? }`. **The plaintext token or code is returned once** and never stored.
- `POST /org/sessions/:id/regenerate` (new code or token, invalidates the old one, only while WAITING)
- `POST /org/sessions/:id/cancel`
- `GET /org/sessions?status=&method=&q=&cursor=`, `GET /org/sessions/:id`
- `GET /org/sessions/:id/events` (SSE)
- `GET /org/sessions/:id/shared-data` → decrypted **approved** fields only, and only if APPROVED or COMPLETED
- `GET /org/sessions/:id/receipt?format=pdf|json`
- `POST /org/sessions/:id/customer-record` → creates a record from the grant and sets COMPLETED
- `GET /org/customers?q=`, `GET /org/customers/:id`
- `GET/POST/PATCH/DELETE /org/members`, `POST /org/invitations`, `POST /invitations/:id/accept`
- `GET /org/audit?cursor=`

Every endpoint has a DTO, Swagger docs, an error-code table, and tests.

---

## 9. Security and privacy requirements

### 9.1 QR token
- 32 random bytes from a CSPRNG, base64url-encoded. The URL is `${APP_ORIGIN}/s/${token}`. Store `sha256(token)`.
- TTL defaults to 15 minutes (per the board), configurable per org between 5 and 30 minutes.
- The scanner accepts a decoded string **only if** its origin equals `APP_ORIGIN` and its path matches `^/s/[A-Za-z0-9_-]{43}$`. Anything else gets "This QR code isn't a DataExchange request" with no navigation.

### 9.2 Share code
- **6 digits** (matches the board), generated with `crypto.randomInt` and displayed as `482 917`. Store `HMAC-SHA256(pepper, code)`. A partial unique index prevents duplicate active codes; regenerate on collision.
- TTL is **5 minutes** and redemption is single-use. The first successful resolve binds the session to that customer, and any other customer receives `SESSION_UNAVAILABLE`.
- A 6-digit space is only 10⁶ codes, so apply all of these mitigations:
  - Authentication is required **before** code entry.
  - Failed attempts are limited per user (5 per 15 min) and per IP hash (20 per 15 min), with exponential cool-down after that.
  - Successful resolves return **metadata only**.
  - Monitor global failure rates and alert above a threshold.
  - Each failure writes a `CODE_REDEEM_FAILED` audit event.
- Error responses don't reveal whether a code existed but expired, beyond what the UX needs. Use `SHARE_CODE_INVALID_OR_EXPIRED` for unknown codes. Return `SESSION_ALREADY_DECIDED` and `SESSION_EXPIRED` only to the bound customer.

### 9.3 Consent decision (the critical path)
Inside one transaction:
1. Lock the session row.
2. Assert the caller is the bound customer, the status is IN_REVIEW, and `now < expiresAt`.
3. Validate `required ⊆ approvedKeys ⊆ requestedKeys` and that all keys are in the catalogue.
4. Assert the profile has a value for each approved key, otherwise return `PROFILE_FIELD_MISSING` with a list of keys.
5. Snapshot values and encrypt them into `payloadCipher`.
6. Create `ConsentGrant` with a receipt id and consent-text version.
7. Set the session to APPROVED and write an audit event.
8. Commit, then emit SSE.

The idempotency key (unique per customer and session) returns the same receipt on retry. If expiry wins the race, nothing is written and `SESSION_EXPIRED` is returned.

### 9.4 Other
- Org isolation: every business query filters by the membership org. Write tests that attempt cross-org access and expect 404.
- STAFF can create, view, and save. ADMIN adds team management and settings. OWNER adds deleting the org and transferring ownership.
- No personal data in URLs (session ids are opaque cuids), logs, analytics, Sentry breadcrumbs, or the service-worker cache. Set `Cache-Control: no-store` on all personal-data responses.
- Account deletion: confirm with typed text, then delete profile and auth linkage and pseudonymise `customerId` in grants. Explain beforehand that **businesses keep records they already received with consent, under their own policies**, and that activity entries tied to those grants will no longer be visible.
- `docs/security.md` must include a threat model (STRIDE-lite) covering code guessing, QR phishing (lookalike origins), replay, session fixation, IDOR, and over-collection, with the mitigations above.

---

## 10. Design system

- **Colour tokens:** `--primary` navy (#0B1F4D), `--primary-foreground` white, `--accent` teal (#0F9D8A), `--success` emerald (#10B981), `--warning` amber (#F59E0B), `--destructive` (#DC2626), surfaces white and cool-gray 50–100, borders gray-200, text gray-900/600. Provide a dark-mode token set (it isn't required to ship toggle UI).
- **Type:** Inter (or Geist) via `next/font`. Scale 12/14/16/20/24/32/40. Use tabular numerals for codes, counters, and timers. Share codes render at 40–56 px, weight 600, with letter-spacing.
- **Radius:** cards 16 px, inputs and buttons 12 px, pills full. **Shadows:** two levels only. **Spacing:** 4-pt grid.
- **Status pills** (icon + text + colour):
  - Waiting: clock + slate, with pulse dot
  - Customer reviewing: eye + blue
  - Approved: check + teal
  - Completed: check-check + emerald
  - Declined: x-circle + rose
  - Expired: timer-off + gray
  - Cancelled: ban + gray
- **Illustrations:** soft flat line illustrations (login skyline, customer welcome), as original SVGs created for this project.
- **Business layout:** fixed 240 px navy sidebar (collapses to a drawer below 1024 px), top bar with org switcher and user menu, content max-width 1280 px.
- **Customer layout:** single column, max-width 480 px, primary action pinned in a bottom action bar within thumb reach, safe-area insets respected.

---

## 11. UX quality bar

Every screen has one clear primary action, inline Zod validation with human-readable errors, button states (default, hover, pressed, loading, disabled, success, error), skeletons for async content, retry on failure, confirmation for destructive actions, and empty states that point to the next step. There are no dead ends: every screen has a way back or home.

Accessibility targets WCAG 2.2 AA: focus visible, focus not obscured by sticky bars, target size ≥ 24 px minimum and 44 px for primary actions, labels on all inputs, `aria-live` regions for status changes and countdowns (announce at 1 min and expiry, not every second), and no colour-only meaning.

---

## 12. Motion and animation system

Motion is a first-class part of the product. It builds **confidence** before sharing personal data and shows that **something real happened** after. It must feel calm, precise, and fintech-grade, never bouncy or playful at the moment of consent.

### 12.1 Library and setup
- `motion` (`import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "motion/react"`).
- Wrap the root in `<MotionConfig reducedMotion="user" transition={tokens.transition.standard}>`.
- Use `LazyMotion` with `domAnimation` features to keep bundle cost down, plus `m.*` components.
- Optionally use the CSS View Transitions API for customer route changes where supported, with Motion `SlideStep` as the fallback. Pick one approach per route and don't double-animate.

### 12.2 Tokens (`apps/web/lib/motion.ts`)

```ts
export const duration = { instant: 0.1, fast: 0.15, standard: 0.22, slow: 0.3, celebrate: 0.6 } as const;
export const ease = {
  standard:   [0.2, 0, 0, 1],      // most UI
  emphasized: [0.05, 0.7, 0.1, 1], // entering, important
  exit:       [0.3, 0, 1, 1],      // leaving
} as const;
export const spring = {
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.8 }, // toggles, press
  gentle: { type: "spring", stiffness: 260, damping: 28 },            // sheets, cards
  pop:    { type: "spring", stiffness: 420, damping: 18 },            // success check only
} as const;
export const stagger = { list: 0.035, digits: 0.05, maxItems: 8 } as const;
export const distance = { step: 24, rise: 8 } as const; // px
```

### 12.3 Primitives (`components/motion/`)

| Primitive | Behaviour | Reduced motion |
|---|---|---|
| `FadeIn` | opacity 0→1, y `rise`→0, `standard` | opacity only |
| `SlideStep` | direction-aware x ±`step` + fade for flow steps. Back reverses direction. | fade 150 ms |
| `Stagger` | children rise in with `stagger.list`, capped at 8 items (the rest appear instantly) | no stagger |
| `PressScale` | whileTap scale 0.98, `snappy` | none |
| `Shake` | x [0,-6,6,-4,4,0] over 300 ms, triggered by error key change | none (error text still appears) |
| `CountUp` | number tween 0→value over 600 ms, once per mount, tabular nums | final value instantly |
| `CountdownRing` | SVG ring `strokeDashoffset` linear to expiry, colour shifts to amber at ≤ 60 s and red at ≤ 15 s, text timer alongside | static ring, text timer only |
| `StatusPulse` | 8 px dot with expanding ring, 2 s loop, paused when `document.hidden` | static dot |
| `SuccessCheck` | circle scale 0.6→1 (`pop`), check path `pathLength` 0→1 (400 ms, 150 ms delay), 8 particles radiate 24–36 px and fade (one burst, 600 ms) | static check, no particles |
| `BottomSheet` | mobile sheet y 100%→0 (`gentle`), drag-to-dismiss, scrim fade | fade |
| `Skeleton` | shimmer gradient sweep 1.4 s | static gray |
| `AnimatedNumberText` | "You're sharing **3** of 5" with the number rolling up or down via `AnimatePresence mode="popLayout"` | instant |

### 12.4 Choreography by screen

**Customer PWA**
- **C01 Welcome:** logo fades in, headline rises (y 8→0), three benefit rows stagger, buttons fade last. Total ≤ 600 ms. The illustration has a static parallax-free fade.
- **C03 OTP:** each typed digit cell pops (scale 0.9→1, `snappy`) and the active cell shows a teal ring. Wrong code triggers `Shake` on the row plus inline error text and `aria-live`. Resend shows a countdown "Resend OTP (00:30)", and when enabled the link fades in. Success: cells turn teal in sequence (40 ms stagger), then route transition.
- **C05 Home:** Scan and Enter code tiles use `PressScale`. Recent activity uses `Stagger`.
- **C06 Scanner:**
  - The camera view fades in after permission.
  - Viewfinder corners "breathe" (scale 1↔1.03, 2.4 s loop).
  - A thin teal scan line sweeps vertically (1.8 s loop).
  - On a valid decode, the corners snap inward to frame the code (150 ms), the frame flashes teal, and `navigator.vibrate?.(20)` fires where supported. Then `SlideStep` goes to review.
  - On an invalid QR, the corners briefly turn amber and a toast slides from the bottom. The camera keeps scanning.
- **C07 Enter code:** same digit pop as OTP. A 6-digit paste fills the boxes with `stagger.digits`. Errors shake. A rate-limited state shows a cool-down countdown.
- **C08 Review request:** the org cover and logo fade in, then the request card rises. The expiry chip uses a mini `CountdownRing`. Continue and Decline are **interactive immediately**, since motion never gates consent.
- **C09 Select:**
  - Toggles move the thumb with `snappy` and tint the track teal. An "off" row value cross-fades to "Not shared".
  - Required rows show a lock icon. Tapping the locked toggle produces a 4 px horizontal nudge and opens a tooltip or bottom-sheet explaining why the field is required.
  - The summary counter animates via `AnimatedNumberText`.
  - A missing profile value expands an inline input with height auto-animation (`gentle`).
- **C10 Confirm:** chosen fields stagger in. The consent note fades. The Share Information button uses `PressScale`, then on submit morphs its label into a spinner (width locked to prevent layout shift) and is disabled to prevent duplicates. **No** success motion yet.
- **C11 Result:**
  - On 2xx, the `SuccessCheck` burst plays, then the title and receipt rows stagger (≤ 900 ms total).
  - On decline: a neutral slate icon fades with no particles. Copy: "Request declined. Nothing was shared."
  - On failure or uncertainty: an amber icon, no burst, an explicit outcome statement, and Retry or Check status.
- **C12 Activity:** list `Stagger`. The detail opens with a shared-layout transition (`layoutId` on the card).

**Business portal**
- **B03 Dashboard:** stat cards fade in with `Stagger`, numbers use `CountUp` from real data, and delta chips fade after the count. Recent requests stagger. A new request arriving via SSE or refetch slides in at the top with a 1 s teal background highlight that fades.
- **B04 Wizard:** the stepper connector line fills with scaleX (`standard`). The completed step circle morphs from number to check. Step panels use `SlideStep` (forward and back aware). Field checkboxes draw their check path (120 ms).
- **B05 QR screen:**
  - The QR card scales 0.96→1 with fade.
  - A `CountdownRing` wraps the expiry pill.
  - A `StatusPulse` reads "Waiting for customer".
  - Live transitions:
    - WAITING→IN_REVIEW: the pill cross-fades to "Customer reviewing" and the QR dims to 40% with blur(2px) because the token is now bound.
    - →APPROVED: the QR collapses (scale 0.9 + fade), and the card layout-morphs into a teal "Information received" panel with a `SuccessCheck` (no particles in the portal, keep it professional), then the CTA "View information" appears.
    - →DECLINED or EXPIRED: a neutral fade to a status panel with a "Create new request" CTA.
  - New QR Code: the old QR fades out and the new one fades in. The ring resets.
- **B06 Share code:** digits enter with a vertical roll (y 12→0, `stagger.digits`). Regenerate rolls the old digits up and out and the new ones in. Copy: the icon morphs copy→check for 1.5 s with a "Copied" tooltip. The expiry ring and live status match B05.
- **B07 Requests table:** row hover lifts the background only (no movement). Filter changes cross-fade the table body. A row status update flashes its pill.
- **B08 Received information:** customer card fades in, then field rows stagger. Consent chips pop in sequence. **Save to Customer Record**: button loading, then success morph (check icon + "Saved"), then a toast slides in from the bottom-right "Information saved successfully" (auto-dismiss 4 s, pausable on hover or focus).
- **Global:** dialogs scale 0.98→1 + fade; toasts slide 16 px + fade; skeletons shimmer; the sidebar active indicator moves between nav items with `layoutId`.

### 12.5 Performance and testing
- Target 60 fps on a mid-range Android device. No animation should cause CLS > 0.05. Hold to the 300 ms page or step limit.
- Playwright runs with `reducedMotion: 'reduce'` for determinism. Add one visual smoke test with motion enabled for the success screen.
- Add a Storybook-lite or `/dev/motion` route (dev only) showcasing every primitive in both modes.

---

## 13. Customer PWA screens

Each screen needs loading, empty, error, and success states and must follow the motion rules in §12.

- **C01 Welcome.** Headline "Your information. Your choice." Subtext "Enter your details once. Share only what you choose, whenever you need." Three benefits: less repetitive typing, fewer entry mistakes, more control. Buttons: Continue with Google, Continue with mobile number, and "Already have an account? Sign in". Footnote: "Creating a profile doesn't verify your real-world identity."
- **C02 Google auth.** Real provider flow with loading, error, and cancel or retry states, then redirect to profile setup (new users) or home. In dev mode, a clearly labelled simulation page.
- **C03 Mobile + OTP.**
  - Country picker (default +91) with E.164 validation, then Send OTP, Verify (6 boxes, autocomplete `one-time-code`), Resend with 30 s cooldown, and Change number.
  - States: invalid, expired, too many attempts (with wait time), and success.
  - OTP values never appear in logs.
- **C04 Profile setup.** First and last name, mobile, email, and optional address. Verified badges only for provider-verified contacts. Save with optimistic UI and rollback on error. Show a completion indicator.
- **C05 Home.**
  - Greeting.
  - Two large primary tiles: **Scan QR code** and **Enter share code**.
  - A "Continue request" card if a bound IN_REVIEW session hasn't expired.
  - Recent activity (3 items + View all), a profile shortcut, and settings.
  - Empty state explaining how sharing works in three steps.
- **C06 QR scanner.**
  - Permission explainer before the camera starts.
  - Denied or unavailable states with an "Enter code instead" fallback.
  - Origin and path validation (§9.1).
  - Torch toggle where supported.
  - Stops the camera on unmount.
- **C07 Enter share code.** Six boxes with auto-advance and paste support. States: invalid or expired, rate-limited (cool-down), already completed, and network retry.
- **C08 Review request.**
  - Org name, logo or monogram, and category.
  - Verification line (honest per §3.2).
  - Purpose and explanation, requested fields with Required or Optional tags, and expiry countdown.
  - "How your data is used" expandable section.
  - Continue and Decline (Decline confirms in a sheet).
- **C09 Select information.**
  - One row per field: icon, label, the customer's own value, a Required (locked, with explanation) or Optional tag, and a switch. **Optional fields default to off.**
  - Summary "You're sharing X of Y requested fields."
  - Missing required values can be added inline.
  - Back link to the request details.
- **C10 Confirm.** Org, purpose, exact fields and values, and consent text: "Only the information above will be shared with {Org} for '{purpose}'. They'll store it under their own policies." Buttons: **Share selected information** and Go back. Duplicate-submit protection and expiry handling.
- **C11 Result.** Org, fields shared, purpose, time, and receipt id (copyable). Buttons: Done, View activity, Return home. Separate honest screens for declined, expired, and failed outcomes.
- **C12 Activity.** A chronological list showing org, purpose, date, decision, and fields requested versus shared, filterable by decision. The detail view shows the full receipt and session status. Notes that hiding an entry doesn't delete a business's records.
- **C13 Profile and privacy.** Edit details, verified contacts, how sharing works, privacy notice, activity, sign out, and **Delete account** (with a retention explanation, typed confirmation, and a real backend workflow).
- **PWA:** manifest (name, icons, theme navy, standalone), installable, offline page ("You're offline. Sharing needs a connection."), and no personal data in caches.

---

## 14. Business portal screens

B01–B08 follow the original brief and the board (§3.1). B09–B12 complete the sections the original brief truncated.

- **B01 Login.**
  - Google and mobile OTP, plus "Create a business account".
  - Post-auth routing: no membership goes to B02, one org goes to the dashboard, multiple orgs go to the org picker.
- **B02 Organization onboarding.** Name, category (select), contact email or phone, and optional logo upload (PNG/SVG ≤ 512 KB, validated server-side). Creates the org and an OWNER membership. Copy distinguishes "signed in" from "business verified (not available yet)".
- **B03 Dashboard.**
  - Total, Completed, Pending (WAITING + IN_REVIEW), and Declined/Expired cards for the selected range (7d, 30d, 90d), with deltas per §3.2.
  - Recent requests and recent customer records, with a quick "Create request" action.
  - Empty org: three-step onboarding checklist.
- **B04 Create request wizard.**
  1. Details: name, purpose (combobox of common purposes + free text, ≤ 120 chars), and optional customer-facing explanation (≤ 200 with counter).
  2. Fields: allowlist with required toggles, at least one field.
  3. Method: QR (in person) or Share code (phone/remote) with TTL.
  4. Review, then **Create session**.
- **B05 QR sharing.** QR from the backend token, org and purpose, fields, reference, countdown, Copy link, New QR code, Cancel request, live status, and New request.
- **B06 Share code.** Large grouped code with copy, org and purpose, fields, countdown, live status, Generate new code (only while WAITING), and a read-aloud hint: "Read the code digit by digit. It works once and expires in 5 minutes."
- **B07 Request management.**
  - Table (cards on mobile) with search, filters (status, method, date), and cursor pagination.
  - Columns: name, customer (known only after approval, otherwise "—"), method, purpose, created, expiry, status, and actions.
  - The detail page shows the timeline of status events.
- **B08 Received information.** Approved fields only, org, purpose, consent timestamp, receipt id, requested versus approved comparison (unapproved shown as "Not shared", never their values), and status. Buttons: Download receipt and Save to Customer Record.
- **B09 Customer records.**
  - Save converts the grant into a `CustomerRecord`, marks the session COMPLETED, and is idempotent (one record per grant).
  - Customer list with search by name, email, or phone (only fields the org received), sorting, and an empty state.
  - Detail shows saved fields, source receipt and purpose, created by, date, and the consent history for that record.
  - Editing a saved record is allowed and audited, but the original consent snapshot is immutable.
- **B10 Consent and activity log.** An org-wide audit timeline (sessions created, codes regenerated, decisions, records saved, receipts exported, member changes), filterable by type, user, and date, with exportable CSV (no personal values, ids only).
- **B11 Team.** Members list with role chips. Invite by email (pending invitation is accepted when a user signs in with that verified email). Change role (ADMIN+), remove member (confirm). An OWNER cannot remove themselves without transferring ownership.
- **B12 Settings.** Org profile and logo, default QR and code TTLs, default consent explanation, data-handling contact shown to customers, and danger zone (delete organization: OWNER only, typed confirmation, explains effects).

---

## 15. Seed and demo data

All seeded data is flagged `isSample`, and the UI shows a "Sample data" chip.

- Org: **Maple Grove Properties** (Property management). Staff: **Ramesh Kumar** (OWNER).
- Customers: **Alex Morgan** (+91 98765 43210, alex.morgan@example.com) and **John Smith** (+1 416 555 0123, john.smith@example.com). Use `example.com` emails only.
- Requests across all statuses: Visitor Registration (Completed), Tenant Application (Waiting), Service Appointment (Completed), Open House Registration (Declined), plus Expired and Cancelled ones. This lets the dashboard and tables render meaningfully.

---

## 16. Testing and QA

- **Unit:** field-set validation, status machine transitions, code and token generation and hashing, rate-limit logic, consent decision service (including the expiry race and idempotency), and metric calculations.
- **Integration (API + test Postgres):** org isolation, IDOR attempts, decision transaction, SSE emits, and deletion workflow.
- **E2E (Playwright, dev auth mode):**
  1. Business creates a QR request → customer resolves the token → approves 3 of 4 → business sees only those 3 → saves the record → it appears in Customers.
  2. Same flow via share code.
  3. Customer declines → business sees Declined and no data.
  4. Expired code → correct error, no data.
  5. Required field enforcement.
  6. Duplicate submit yields one grant.
  7. Rate limit triggers on repeated bad codes.
- **Accessibility:** axe on every route; keyboard-only run of both core flows.
- **Responsive:** 360, 390, 430, 768, 1024, and 1440 px snapshots.
- **Manual device checklist** in `docs/qa.md`: iOS Safari and Android Chrome camera scan over HTTPS, PWA install, and OTP autofill.

---

## 17. DevOps

- `docker-compose.yml`: Postgres 16 (plus Mailpit if email invites need local testing).
- `.env.example` documents every variable: `APP_ORIGIN`, `API_ORIGIN`, `DATABASE_URL`, `AUTH_MODE`, Clerk keys and JWKS URL, `SHARE_CODE_PEPPER`, `DATA_ENC_KEY` and `DATA_ENC_KEY_ID`, and TTL defaults.
- GitHub Actions: install (pnpm cache), lint, typecheck, unit tests, API integration tests against a Postgres service, build web and api, and Playwright on main or labelled PRs.
- Deploy: web on Vercel, API on Railway (or equivalent), managed Postgres, HTTPS everywhere, `prisma migrate deploy` on release. `docs/deployment.md` covers callback URLs, allowed origins, and environment setup per environment.
- Observability: structured logs with redaction, `/health` and `/ready`, and error tracking with PII scrubbing.

---

## 18. Build phases and acceptance criteria

Build in order. Don't start a phase until the previous phase's checks pass.

1. **Foundation.** Monorepo, shared package, design tokens, motion tokens and primitives, `/dev/motion` showcase, Docker, Prisma schema and migrations, seed, CI green.
   ✅ `pnpm dev` runs both apps, Swagger loads, and the primitives demo works in both motion modes.
2. **Auth.** Clerk integration (Google + phone OTP), JWT guard, user upsert, dev mode with banner and production refusal.
   ✅ Sign-in works in both modes, protected routes redirect, and the API rejects invalid tokens.
3. **Customer profile.** C01–C05 and C13 (minus deletion).
   ✅ Profile CRUD with validation, verified badges are accurate, and responsive and accessible.
4. **Business org and sessions.** B01–B06 with real QR and code generation, countdowns, SSE status, cancel, and regenerate.
   ✅ Token and code are stored hashed, the plaintext is shown once, and expiry is enforced.
5. **Consent core.** C06–C11, resolve endpoints, rate limits, and the decision transaction.
   ✅ E2E flows 1–7 pass and the backend enforces the approved set.
6. **Records and history.** B07–B10, C12, receipts, and audit.
   ✅ Search works, there is one record per grant, and the audit covers all state changes.
7. **Team, settings, deletion, and PWA.** B11, B12, account deletion, manifest, service worker, offline page.
   ✅ Roles enforced, deletion pseudonymises grants, PWA installable.
8. **Hardening.** Threat model, security headers, a11y pass, performance pass (Lighthouse mobile ≥ 90 for performance, accessibility, and best practices on customer routes), docs complete.

---

## 19. Deliverables

- Working repository meeting `CLAUDE.md` §7 for every feature
- `README.md` with a quick start under 10 minutes
- `docs/`: architecture (diagram), ADRs, auth setup (provider, pricing considerations, callback URLs, local setup), security and threat model, deployment, QA checklist, and roadmap
- Swagger/OpenAPI spec
- Seed script and demo walkthrough (`docs/demo.md`) reproducing the board's flows end to end

---

## 20. Guardrails — never do these

- Fake Google or OTP auth outside the labelled dev mode, or hardcoded OTPs
- Personal data in QR payloads, codes, URLs, logs, or caches
- Releasing data before server-confirmed approval, or after expiry
- Pre-checking optional fields, hiding Decline, or other dark patterns
- "Verified" badges without a real verification record
- Hardcoded or fabricated dashboard metrics
- Collecting DOB, government IDs, payment, medical, or emergency-contact data
- Celebration animations on uncertain or failed outcomes; motion that delays consent actions; ignoring reduced motion
- Adding Redis, microservices, Kubernetes, or NFC to the MVP
- Claims of certification, compliance, patentability, or guaranteed success
