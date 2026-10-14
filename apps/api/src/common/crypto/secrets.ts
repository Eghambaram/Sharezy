import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { SHARE_CODE_LENGTH } from "@dx/shared";

/** 32 CSPRNG bytes, base64url without padding (43 chars). Returned to the business once. */
export function generateQrToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Stored form of a QR token. */
export function hashQrToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

/** Uniform 6-digit code, leading zeros allowed. Returned to the business once. */
export function generateShareCode(): string {
  return randomInt(0, 10 ** SHARE_CODE_LENGTH)
    .toString()
    .padStart(SHARE_CODE_LENGTH, "0");
}

/** Stored form of a share code: HMAC-SHA256 with a server-side pepper. */
export function hashShareCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code, "utf8").digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** One-way hash for IP addresses in audit events and rate-limit keys. */
export function hashIp(ip: string, pepper: string): string {
  return createHmac("sha256", pepper).update(`ip:${ip}`, "utf8").digest("base64url").slice(0, 22);
}

// Crockford-style alphabet: no 0/O, 1/I/L, U — easy to read aloud.
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomChars(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += REF_ALPHABET[randomInt(0, REF_ALPHABET.length)];
  return out;
}

/** Human-friendly session reference, e.g. REQ-7K4M2. Not a secret. */
export function generateReference(): string {
  return `REQ-${randomChars(5)}`;
}

/** Consent receipt id, e.g. DX-7K4M-92QF. Not a secret. */
export function generateReceiptId(): string {
  return `DX-${randomChars(4)}-${randomChars(4)}`;
}
