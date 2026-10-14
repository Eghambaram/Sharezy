# ADR 0001 — Auth provider: Clerk (fallback Auth0)

- **Status:** Proposed. Clerk is the default; the coverage and pricing checks below must be done before Phase 2 merges.
- **Date:** 2026-10-14

## Context

Customers sign in with Google or mobile OTP. Businesses use the same methods. We need:

- Google OIDC and SMS OTP, with India (+91) delivery as the first market.
- Provider-side OTP generation, expiry, attempt limits, and bot protection. We never store or log OTPs.
- JWTs that NestJS can verify through JWKS (issuer, audience, expiry, signature).
- First-class Next.js App Router support.

## Decision

Use **Clerk** as the default provider. Put provider calls behind an `AuthProvider` interface in both apps so a swap stays contained:

- **web:** `lib/auth/provider.ts` handles sign-in, sign-out, and getting a token.
- **api:** `modules/auth/auth-provider.ts` verifies a token and returns `{ subject, email?, emailVerified, phone?, phoneVerified }`.

The NestJS `AuthGuard` verifies the bearer JWT and upserts a local `User` by `authSubject`.

**Dev mode (`AUTH_MODE=dev`).** A simulated sign-in page lists seeded synthetic users. The API accepts HS256 JWTs signed with `DEV_JWT_SECRET`. A persistent amber banner is always shown. The API **refuses to boot** with `AUTH_MODE=dev` when `NODE_ENV=production`. This is enforced in `apps/api/src/config/env.ts` and unit-tested.

## To verify before Phase 2 (do not mark Accepted until done)

| Check | Result |
|---|---|
| Clerk SMS OTP delivery to India (+91) is supported, including DLT registration requirements | _TBD: confirm on clerk.com docs and pricing page_ |
| Current pricing for SMS and MAU at the expected volume | _TBD_ |
| Rate limits and bot protection settings available for OTP | _TBD_ |
| Google OIDC verified-email claim is available in the session JWT | _TBD_ |

If India SMS is unsupported or uneconomic, switch to **Auth0** (Google plus passwordless SMS via Twilio or MessageBird) behind the same interfaces.

## Implementation notes (Phase 2)

- **API.** `AuthProvider` is implemented by `DevAuthProvider` (HS256) and `ClerkAuthProvider` (RS256 via `jose` and remote JWKS). `ClerkAuthProvider` checks the issuer, expiry, and `azp` against `APP_ORIGIN`, and rejects tokens with `sts: "pending"`.
- **Verified contacts** come from the Clerk Backend API (`GET /v1/users/{id}`), not from session-token claims, which can be misconfigured or customised.
- **Web.** Feature code uses `AuthClient` (`getToken`, `signOut`). `ClerkProvider` mounts only in Clerk mode. Route gating happens close to the data, in server layouts, because Clerk has deprecated `createRouteMatcher`.
- **Prebuilt Clerk UI first.** Clerk mode uses the prebuilt `<SignIn>` and `<SignUp>` components. The custom OTP screens on the board (C03) will follow once there is a Clerk instance to test against. Building them untested would risk a broken login.

## Consequences

- We depend on a third party for identity. The interface boundary keeps the swap cost to roughly two adapter files plus configuration.
- `phoneVerified` and `emailVerified` are set **only** from provider claims. This backs the "verified contact" badge (CLAUDE.md §1.7).
