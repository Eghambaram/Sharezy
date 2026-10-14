/**
 * Format rules for opaque QR tokens and share codes. Generation and hashing
 * happen on the API only; these helpers validate shape on both sides.
 */

/** 32 random bytes, base64url, no padding → 43 chars. */
export const QR_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const QR_PATH_PATTERN = /^\/s\/[A-Za-z0-9_-]{43}$/;

export const SHARE_CODE_LENGTH = 6;
export const SHARE_CODE_PATTERN = /^\d{6}$/;

export const QR_TTL_MINUTES = { min: 5, max: 30, default: 15 } as const;
export const CODE_TTL_MINUTES = 5;

/**
 * Accepts a decoded QR string only if its origin equals `appOrigin` exactly
 * and its path is `/s/<43-char token>`. Returns the token, or null.
 * Lookalike origins, extra query strings, and fragments are rejected.
 */
export function parseShareQr(decoded: string, appOrigin: string): string | null {
  let url: URL;
  let expected: URL;
  try {
    url = new URL(decoded.trim());
    expected = new URL(appOrigin);
  } catch {
    return null;
  }
  if (url.origin !== expected.origin) return null;
  if (url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "") return null;
  if (!QR_PATH_PATTERN.test(url.pathname)) return null;
  return url.pathname.slice(3);
}

/** Strips whitespace and separators a person might type or paste ("482 917", "482-917"). */
export function normalizeShareCode(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/** Display format: "482 917". */
export function formatShareCode(code: string): string {
  return SHARE_CODE_PATTERN.test(code) ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
