# ADR 0003 — Configuration, secrets, and payload encryption

- **Status:** Accepted
- **Date:** 2026-10-14

## Decision

- **One root `.env`** for local development, read by the API (`main.ts`), Prisma (`prisma.config.ts`), and Next.js (`next.config.ts`). Deployed environments inject variables directly.
- **Fail-fast validation.** `apps/api/src/config/env.ts` validates everything with Zod before Nest starts. Error messages name the variable and the problem, never the value. In production it rejects:
  - `AUTH_MODE=dev`
  - the dev-only pepper and encryption key shipped in `.env.example`
  - non-HTTPS origins
- **QR tokens** are 32 CSPRNG bytes, base64url. The database stores `sha256(token)`.
- **Share codes** are 6 digits from `crypto.randomInt`. The database stores `HMAC-SHA256(SHARE_CODE_PEPPER, code)`. A partial unique index on `codeHash WHERE status = 'WAITING'` blocks duplicate active codes.
- **Consent payloads** use AES-256-GCM. The format is `version | iv(12) | tag(16) | ciphertext`. The grant id is bound as additional authenticated data (AAD), so a ciphertext can't be moved to another grant. `payloadKeyId` records which key encrypted each row, which supports rotation: decrypt with the key the row names, encrypt with the current key.

## Alternatives considered

- **`@nestjs/config`.** Rejected because a plain Zod schema gives typed config and testable production guards with less indirection.
- **Encryption in the database (pgcrypto).** Rejected because keys would reach the database server and query logs.
