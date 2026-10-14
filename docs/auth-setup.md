# Auth setup

DataExchange has two auth modes, chosen with `AUTH_MODE` (API) and `NEXT_PUBLIC_AUTH_MODE` (web). Set both to the same value.

| Mode | Use for | What happens |
|---|---|---|
| `dev` | Local development, CI, end-to-end tests | `/dev/sign-in` lists synthetic users. The API accepts HS256 tokens signed with `DEV_JWT_SECRET`. An amber banner is shown on every page. |
| `clerk` | Staging, production | Real Google and phone OTP sign-in through Clerk. The API verifies RS256 session tokens against Clerk's JWKS. |

The API **refuses to start** with `AUTH_MODE=dev` when `NODE_ENV=production`. It also refuses the dev-only secrets from `.env.example` in production.

## How it fits together

```
Browser ──getToken()──▶ AuthClient (web/lib/auth)
   │                       ├─ dev:   httpOnly cookie → server action returns the token
   │                       └─ clerk: Clerk useAuth().getToken()
   └──Authorization: Bearer <jwt>──▶ API AuthGuard (global; @Public() opts out)
                                        ├─ AuthProvider.verify(token)  (dev | clerk)
                                        └─ UsersService.resolveFromProvider(subject)
                                             ├─ creates User on first sight (audit: USER_CREATED)
                                             └─ refreshes provider-verified email/phone (≤ every 15 min)
```

- **Route protection on the web** happens in server-side layouts: `app/(customer)/(signed-in)/layout.tsx` and `app/(business)/biz/(portal)/layout.tsx`. These only check that a session exists. **The API decides everything else.**
- **Verified contacts.** `User.email` and `User.phone` hold **provider-verified values only**. In Clerk mode they come from the Clerk Backend API, where `verification.status === "verified"`, not from client-supplied claims. A value already linked to another account is not stored. Dev users never have verified contacts.
- **Expired or rejected sessions.** When the API returns `UNAUTHENTICATED`, the web app signs out properly before redirecting, so a stale session can't cause a redirect loop.

## Enabling Clerk

1. **Create a Clerk application.**
   - Enable **Google** under SSO connections.
   - Enable **Phone number** with **SMS verification code** as a sign-in method.
   - Disable passwords if you want OTP-only.
2. **Check SMS coverage and pricing for India (+91)** and record the result in [ADR 0001](adr/0001-auth-provider.md). This is required before going live.
3. **Configure protections.** In the Clerk Dashboard, turn on bot protection and review the rate limits for OTP attempts. The provider handles OTP generation, expiry, and attempt limits. We never see or store OTPs.
4. **Set the environment variables:**

   ```bash
   AUTH_MODE=clerk
   NEXT_PUBLIC_AUTH_MODE=clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
   CLERK_SECRET_KEY=sk_test_…
   CLERK_ISSUER=https://<instance>.clerk.accounts.dev          # Frontend API URL
   CLERK_JWKS_URL=https://<instance>.clerk.accounts.dev/.well-known/jwks.json
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   ```

5. **Set allowed origins.** In Clerk, the allowed origin and redirect URLs must include `APP_ORIGIN`. The API rejects any token whose `azp` claim isn't `APP_ORIGIN`.

### Callback and redirect URLs

| Environment | Sign-in | After sign-in (customer) | After sign-in (business) |
|---|---|---|---|
| Local | `http://localhost:3000/sign-in` | `/home` | `/biz/dashboard` |
| Production | `https://<APP_ORIGIN>/sign-in` | `/home` | `/biz/dashboard` |

The business login passes `redirect_url=/biz/dashboard`. The customer welcome page passes `redirect_url=/home`.

## Not yet built

- **Custom OTP screens.** Clerk mode currently uses Clerk's prebuilt `<SignIn>` and `<SignUp>` components, themed with our tokens. The board's custom C03 screens (country picker, six OTP boxes, resend countdown) need Clerk's custom-flow hooks. They will be built and tested once a Clerk development instance is available.
- **Clerk mode hasn't been run end to end** in this repository yet, because no keys are configured. The token verification and contact sync are unit-tested with locally generated RS256 keys and a mocked Backend API.
