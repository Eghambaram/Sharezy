import { describe, expect, it } from "vitest";
import { formatShareCode, normalizeShareCode, parseShareQr } from "./tokens.js";
import { resolveCodeSchema } from "./schemas.js";

const ORIGIN = "https://app.dataexchange.example";
const TOKEN = "A".repeat(20) + "b_-".repeat(7) + "z".repeat(2); // 43 chars

describe("parseShareQr", () => {
  it("accepts an exact-origin share URL", () => {
    expect(TOKEN).toHaveLength(43);
    expect(parseShareQr(`${ORIGIN}/s/${TOKEN}`, ORIGIN)).toBe(TOKEN);
  });

  it.each([
    ["lookalike host", `https://app.dataexchange.example.evil.test/s/${TOKEN}`],
    ["http downgrade", `http://app.dataexchange.example/s/${TOKEN}`],
    ["userinfo trick", `https://app.dataexchange.example@evil.test/s/${TOKEN}`],
    ["wrong path", `${ORIGIN}/x/${TOKEN}`],
    ["short token", `${ORIGIN}/s/${TOKEN.slice(1)}`],
    ["query string", `${ORIGIN}/s/${TOKEN}?name=alex`],
    ["fragment", `${ORIGIN}/s/${TOKEN}#x`],
    ["not a URL", "hello"],
  ])("rejects %s", (_label, value) => {
    expect(parseShareQr(value, ORIGIN)).toBeNull();
  });
});

describe("share code format", () => {
  it("normalises typed separators", () => {
    expect(normalizeShareCode(" 482 917 ")).toBe("482917");
    expect(normalizeShareCode("482-917")).toBe("482917");
  });

  it("formats for display", () => {
    expect(formatShareCode("482917")).toBe("482 917");
  });

  it("schema accepts spaced input and rejects non-digits", () => {
    expect(resolveCodeSchema.parse({ code: "482 917" })).toEqual({ code: "482917" });
    expect(resolveCodeSchema.safeParse({ code: "48291a" }).success).toBe(false);
    expect(resolveCodeSchema.safeParse({ code: "48291" }).success).toBe(false);
  });
});
