# ADR 0002 — Toolchain versions and API test runner

- **Status:** Accepted
- **Date:** 2026-10-14

## Context

When the project was scaffolded, several dependencies had moved past the versions assumed in `CLAUDE.md` §2:

- **NestJS 12** is ESM-only (`"type": "module"`). The official Nest 12 starter uses **Vitest**, not Jest.
- **TypeScript 7** (the native port) is the npm `latest`. typescript-eslint (`<6.1`) and ts-jest (`<7`) don't support it yet.
- **Prisma**'s npm `latest` tag points to an 8.0 release candidate. The latest stable release is 7.10. Prisma 7 requires a driver adapter and `prisma.config.ts`.
- **ESLint 10** is out, but `eslint-plugin-react`, which `eslint-config-next` uses, isn't confirmed compatible with it.
- pnpm's `minimumReleaseAge` policy flagged `motion@14.2.0` and `lucide-react@1.56.0`, which were less than a day old.

## Decision

| Area | Choice |
|---|---|
| TypeScript | `~6.0.3` everywhere |
| API tests | **Vitest** instead of Jest (CLAUDE.md §2 lists Jest). Jest under ESM needs `--experimental-vm-modules` and remains fragile. Vitest is what the Nest 12 starter ships with. It handles decorator metadata through Vite's transformer and matches the runner used for web and shared. |
| Prisma | `7.10.0` (stable), `prisma-client` generator emitting ESM into `apps/api/src/generated/prisma`, `@prisma/adapter-pg` |
| ESLint | `^9.39` (flat config) |
| Motion / Lucide | `^14.1.0` / `^1.55.0`, resolved to versions that satisfy the release-age policy. We don't bypass that policy. |

## Consequences

- `CLAUDE.md` §2 still says "Jest (api)". Update it to "Vitest (api)" when this ADR is accepted by the team.
- Revisit TypeScript 7 once typescript-eslint supports it.
- Revisit Prisma 8 once it reaches a stable release.
