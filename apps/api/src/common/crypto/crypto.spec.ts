import { QR_TOKEN_PATTERN, SHARE_CODE_PATTERN } from "@dx/shared";
import { decryptPayload, encryptPayload, parseKey } from "./payload-cipher.js";
import {
  generateQrToken,
  generateReceiptId,
  generateReference,
  generateShareCode,
  hashQrToken,
  hashShareCode,
  safeEqual,
} from "./secrets.js";

describe("QR tokens", () => {
  it("are 43-char base64url and unique", () => {
    const tokens = new Set(Array.from({ length: 200 }, generateQrToken));
    expect(tokens.size).toBe(200);
    for (const t of tokens) expect(t).toMatch(QR_TOKEN_PATTERN);
  });

  it("hash deterministically and never equal the plaintext", () => {
    const t = generateQrToken();
    expect(hashQrToken(t)).toBe(hashQrToken(t));
    expect(hashQrToken(t)).not.toBe(t);
  });
});

describe("share codes", () => {
  it("are always 6 digits", () => {
    for (let i = 0; i < 500; i++) expect(generateShareCode()).toMatch(SHARE_CODE_PATTERN);
  });

  it("HMAC depends on the pepper", () => {
    expect(hashShareCode("482917", "a".repeat(32))).not.toBe(hashShareCode("482917", "b".repeat(32)));
    expect(hashShareCode("482917", "a".repeat(32))).toBe(hashShareCode("482917", "a".repeat(32)));
  });

  it("safeEqual compares without throwing on length mismatch", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("references", () => {
  it("match their formats", () => {
    expect(generateReference()).toMatch(/^REQ-[2-9A-HJKMNP-TV-Z]{5}$/);
    expect(generateReceiptId()).toMatch(/^DX-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$/);
  });
});

describe("payload cipher", () => {
  const key = parseKey("k1", Buffer.alloc(32, 9).toString("base64"));
  const value = { FULL_NAME: "Alex Morgan", EMAIL: "alex.morgan@example.com" };

  it("round-trips", () => {
    expect(decryptPayload(encryptPayload(value, key, "grant-1"), key, "grant-1")).toEqual(value);
  });

  it("does not contain plaintext", () => {
    expect(Buffer.from(encryptPayload(value, key, "grant-1")).toString("utf8")).not.toContain("Alex");
  });

  it("fails when moved to another grant (AAD mismatch)", () => {
    expect(() => decryptPayload(encryptPayload(value, key, "grant-1"), key, "grant-2")).toThrow();
  });

  it("fails with the wrong key", () => {
    const other = parseKey("k2", Buffer.alloc(32, 1).toString("base64"));
    expect(() => decryptPayload(encryptPayload(value, key, "g"), other, "g")).toThrow();
  });

  it("rejects keys that aren't 32 bytes", () => {
    expect(() => parseKey("bad", Buffer.alloc(16).toString("base64"))).toThrow();
  });
});
