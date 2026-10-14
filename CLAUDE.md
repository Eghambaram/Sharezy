# CLAUDE.md — DataExchange (Personal Data Exchange Platform)

> Standing instructions for Claude Code in this repository. Read this first, every session.
> The full product and build specification lives in `PROMPT.md`. When they conflict, **security and privacy rules in this file win**, then `PROMPT.md`, then convenience.

**Product in one line:** *Enter once. Share anywhere.* Customers keep a reusable profile and approve field-by-field sharing with businesses. Businesses start a request by QR code (in person) or a one-time share code (by phone).

---

## 1. Non-negotiable invariants

Never break these, even temporarily, even in demo code. If a task seems to need breaking one, stop and ask.

1. **Consent is enforced on the server.** The backend decides which fields a business may see. The frontend only displays what the API returns.
2. **No personal data in QR codes, share codes, URLs, query strings, logs, analytics, or error messages.** A QR contains only `https://<APP_ORIGIN>/s/<opaque-token>`.
3. **A share code or QR token is never authorization to read data.** It only resolves pending request *metadata* for an **authenticated** customer.
4. **Nothing is released before explicit approval succeeds on the server.** Expired, cancelled, or already-decided sessions release nothing.
5. **Approved set rule:** `required ⊆ approved ⊆ requested`, validated against the field allowlist (`packages/shared/src/fields.ts`). Arbitrary field keys are rejected.
6. **Secrets are stored hashed.** QR tokens use SHA-256 and share codes use HMAC-SHA256 with a server pepper. OTPs are handled by the auth provider and are never stored or logged by us.
7. **No fake trust signals.** Never show "verified" for a business or identity unless a real verification record exists. A verified badge on a contact detail means OTP or provider verification actually happened.
8. **No insecure auth fallback.** If provider credentials are missing, the app runs in `AUTH_MODE=dev` with a persistent, visible "Development simulation — synthetic data" banner. It must refuse to start with `AUTH_MODE=dev` when `NODE_ENV=production`.
9. **Success UI only on confirmed success.** A success screen or celebration animation appears only after a 2xx response from the server. Uncertain outcomes say so plainly.
10. **Every org-scoped query filters by `organizationId` from the authenticated membership.** It never comes from request input alone.

---

## 2. Stack (do not swap without an ADR in `docs/adr/`)

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`) |
| Web | Next.js (App Router), React, TypeScript strict, Tailwind CSS, shadcn/ui, Lucide |
| Forms / data | React Hook Form + Zod, TanStack Query |
| Motion | `motion` (Motion for React, `import { motion } from "motion/react"`) |
| QR | `qrcode.react` (generate). Native `BarcodeDetector` when available, else `@zxing/browser` (scan) |
| PWA | Web manifest + Serwist service worker. **Never cache API responses containing personal data.** |
| API | NestJS, REST, Swagger at `/docs`, class-validator DTOs, SSE for live session status |
| DB | PostgreSQL + Prisma (migrations, FKs, unique constraints, indexes) |
| Auth | Clerk (Google OIDC + phone OTP), verified in NestJS via JWKS. See `docs/adr/0001-auth-provider.md` |
| Rate limiting | `@nestjs/throttler` with Postgres-backed storage (no Redis in MVP) |
| Tests | Vitest (web/shared), Jest (api), Playwright + axe (e2e/a11y) |
| CI | GitHub Actions: lint, typecheck, test, build |

**Not in MVP:** Kubernetes, Redis, microservices, NFC, wallet SDKs, identity verification, payments, DOB, government IDs, medical data, emergency contacts.

Check installed versions in `package.json` before adding or upgrading anything. Prefer current stable, mutually compatible releases.

---

## 3. Repository layout

```
apps/
  web/                      # Next.js — one app, two experiences
    app/(customer)/...      # PWA, mobile-first: /welcome /home /scan /code /r/[sessionId]/... /activity /profile
    app/(business)/biz/...  # Portal, desktop-first: /biz/dashboard /biz/requests /biz/customers /biz/team /biz/settings
    app/s/[token]/          # QR landing → resolves token → customer review flow
    components/ui/          # shadcn primitives (owned code)
    components/motion/      # motion primitives (see §6)
    lib/motion.ts           # motion tokens — the ONLY source of durations/easings/springs
    lib/api/                # typed API client + TanStack Query hooks
  api/
    src/modules/            # auth, users, profiles, organizations, memberships, sessions,
                            # consent, customer-records, audit, realtime, health
    prisma/schema.prisma
packages/
  shared/                   # Zod schemas, FIELD_CATALOG allowlist, enums, status machine, DTO types
docs/
  adr/  architecture.md  security.md  auth-setup.md  deployment.md
```

---

## 4. Commands

```bash
pnpm install
docker compose up -d                       # Postgres 16 on :5432
cp .env.example .env                       # AUTH_MODE=dev works without provider keys
pnpm -F api prisma migrate dev
pnpm -F api prisma db seed                 # synthetic, clearly labelled demo data
pnpm dev                                   # web :3000, api :4000 (Swagger at :4000/docs)

pnpm lint && pnpm typecheck && pnpm test   # must pass before you call a task done
pnpm -F web test:e2e                       # Playwright (runs with reducedMotion: 'reduce')
```

Camera-based QR scanning needs HTTPS on a phone. Use `pnpm -F web dev:https` or a tunnel for device testing.

---

## 5. Coding conventions

- TypeScript strict, no `any`, no non-null `!` on external data. Validate at every boundary: Zod on the web, DTOs on the API, shared Zod for contracts.
- Field keys, statuses, and roles come from `packages/shared`. Never hardcode string literals for them.
- Session state changes go through the status machine in `packages/shared/src/session-status.ts`. Decision, cancel, and expire run inside a Prisma transaction with a row lock (`SELECT … FOR UPDATE` via `$queryRaw`) and an idempotency key.
- API errors use one envelope: `{ error: { code, message, retryable } }`. Codes are stable strings (`SHARE_CODE_EXPIRED`, `SESSION_ALREADY_DECIDED`, `RATE_LIMITED`, …). The UI maps codes to copy and never shows raw messages.
- Logging is structured JSON with an allowlist of fields. Personal data, tokens, codes, and OTPs are redacted by default.
- Every state-changing endpoint writes an `AuditEvent`.
- Components: server components by default, `"use client"` only where needed. Colocate a feature's query hooks with the feature.
- Copy is plain and calm, with sentence case. Say exactly what happens to data. No dark patterns: Decline is as easy to find as Approve.
- Synthetic records are labelled in the UI ("Sample data").

---

## 6. Design and motion rules

**Tokens** live in `apps/web/app/globals.css` (Tailwind theme) and `lib/motion.ts`. Don't inline hex values, durations, or easings in components.

Palette: navy `--primary` (≈ #0B1F4D), teal/emerald `--accent` (≈ #0F9D8A) for privacy, consent, and success. Use white and cool-gray surfaces, amber for warnings and expiry, red for errors. Status is never conveyed by color alone; always pair it with an icon and text.

**Motion principles:**
1. Motion explains state change, such as where something came from or what just happened. It is never decoration for its own sake.
2. Animate `transform` and `opacity` only. Never animate layout-thrashing properties on large surfaces.
3. Durations: micro 100–150 ms, standard 200–250 ms, page/step ≤ 300 ms, celebration ≤ 900 ms total.
4. Motion never blocks input or delays the consent buttons. Approve and Decline are interactive the instant the screen renders.
5. `prefers-reduced-motion` is respected via `<MotionConfig reducedMotion="user">` at the root, plus `useReducedMotion()` for custom sequences. Reduced mode keeps opacity fades of ≤ 150 ms and removes movement, loops, count-ups, and particles.
6. Looping animations (waiting pulse, scan line) pause when the tab is hidden and never run in reduced mode.
7. No celebratory motion on failure, uncertainty, or decline. Decline gets a neutral acknowledgement.
8. Use only primitives from `components/motion/` (`FadeIn`, `SlideStep`, `Stagger`, `PressScale`, `SuccessCheck`, `CountdownRing`, `CountUp`, `Shake`, `StatusPulse`, `BottomSheet`). Add a new primitive there rather than one-off variants in feature code.

The full choreography catalogue is in `PROMPT.md` §12.

---

## 7. Definition of done for any task

- [ ] Works end-to-end against the real API, not mocks, unless the task is explicitly UI-only.
- [ ] Loading, empty, error (with retry), disabled, and success states exist.
- [ ] Keyboard-operable with visible focus. Touch targets are ≥ 44×44 px. axe shows no serious violations.
- [ ] Reduced-motion path checked.
- [ ] Mobile 360–430 px checked for customer screens, ≥ 1280 px and tablet for business screens.
- [ ] Unit tests for logic. E2E updated if a core flow changed.
- [ ] No personal data in logs, URLs, or client caches. Org scoping verified.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` passes.
- [ ] Docs, ADR, or `.env.example` updated if behaviour or configuration changed.

---

## 8. Working style

- Read `PROMPT.md` sections relevant to the task before writing code.
- Make reasonable decisions and record significant ones as ADRs. Ask only when a choice is irreversible or touches the invariants in §1.
- Build vertical slices (DB → API → UI → test) rather than screens without backends.
- Keep the MVP small. If a feature isn't in `PROMPT.md` scope, propose it instead of building it.
- Never claim certification, regulatory compliance, patentability, or verified identity anywhere in the product or docs.
