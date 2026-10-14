# DataExchange

**Enter once. Share anywhere.** Customers keep one reusable profile and approve sharing field by field. A business starts a request with a QR code (in person) or a one-time share code (by phone). The business receives only the fields the customer approved, and the server enforces that.

> This is a product concept and MVP. It makes no claims of verified identity, certification, or regulatory compliance.

- Product and build spec: [`PROMPT.md`](PROMPT.md)
- Standing engineering rules: [`CLAUDE.md`](CLAUDE.md). Its security invariants override everything else.
- Decisions: [`docs/adr/`](docs/adr/)

## Quick start (about 5 minutes)

**Prerequisites:** Node ≥ 22.12 (24 recommended), pnpm 12, Docker.

```bash
pnpm install
docker compose up -d                 # Postgres 16 on :5432
cp .env.example .env                 # AUTH_MODE=dev works without provider keys
pnpm -F api db:migrate               # apply migrations and generate the Prisma client
pnpm -F api db:seed                  # synthetic, clearly labelled sample data
pnpm dev                             # web :3000, api :4000
```

Then open:

| URL | What |
|---|---|
| http://localhost:3000/welcome | Customer sign-in (C01). In dev mode you pick a synthetic user. |
| http://localhost:3000/biz/login | Business sign-in (B01) |
| http://localhost:3000/dev | Developer tools: live API and database status, plus links |
| http://localhost:3000/dev/motion | Motion primitives showcase. Dev only; toggle between full and reduced motion. |
| http://localhost:4000/docs | Swagger UI |
| http://localhost:4000/health, `/ready` | Liveness and readiness (readiness checks the database) |

In `AUTH_MODE=dev` every page shows an amber "Development simulation" banner. The API refuses to start with `AUTH_MODE=dev`, or with the dev-only secrets from `.env.example`, when `NODE_ENV=production`.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # must pass before a task is done
pnpm -F api test:int                       # API integration tests (Docker Postgres, separate _test database)
pnpm -F web test:e2e                       # Playwright + axe (starts the apps if they aren't running)
pnpm build
```

Before the first e2e run, install the browser with `pnpm -F web exec playwright install chromium`.

## Auth

Dev mode works without any provider keys. To turn on real Google and phone OTP sign-in through Clerk, see [`docs/auth-setup.md`](docs/auth-setup.md).

## Layout

```
apps/web         Next.js 16 (App Router), Tailwind 4, Motion. Customer PWA and business portal.
apps/api         NestJS 12 (ESM), Prisma 7 + Postgres, Swagger at /docs.
packages/shared  Field allowlist, session status machine, enums, error codes, Zod contracts.
docs/adr         Architecture decision records.
```

## Sample data

`prisma db seed` creates **Maple Grove Properties** (owner: Ramesh Kumar), two customers (**Alex Morgan** and **John Smith**, both with `example.com` emails), and eight requests that cover every status. Every seeded row is flagged `isSample`.

- No organization or contact detail is marked verified, because no real verification happened.
- Pending sessions get tokens and codes whose plaintext is thrown away, the same as in production, so they can't be redeemed.

## Build status

Work follows the phases in `PROMPT.md` §18.

- [x] **1. Foundation.** Monorepo, shared package, design and motion tokens, motion primitives and showcase, Docker, Prisma schema, migrations, seed, CI.
- [x] **2. Auth.** Dev mode (with banner and production refusal), Clerk adapter, global token guard, user creation on first sign-in, protected routes. Clerk mode hasn't been run end to end yet because it needs keys.
- [ ] 3. Customer profile
- [ ] 4. Business org and sessions
- [ ] 5. Consent core
- [ ] 6. Records and history
- [ ] 7. Team, settings, deletion, PWA
- [ ] 8. Hardening
