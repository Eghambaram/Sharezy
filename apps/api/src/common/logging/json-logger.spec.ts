import { JsonLogger, redact } from "./json-logger.js";

describe("redact", () => {
  it("keeps allowlisted scalars and redacts everything else", () => {
    expect(redact({ msg: "x", sessionId: "s1", email: "alex@example.com", code: "SHARE_CODE_EXPIRED", otp: "123456" })).toEqual({
      msg: "x",
      sessionId: "s1",
      email: "[redacted]",
      code: "SHARE_CODE_EXPIRED",
      otp: "[redacted]",
    });
  });

  it("redacts nested objects even under allowlisted keys", () => {
    expect(redact({ msg: { phone: "+919876543210" } })).toEqual({ msg: "[redacted]" });
  });
});

describe("JsonLogger", () => {
  it("writes one JSON line without non-allowlisted values", () => {
    const lines: string[] = [];
    new JsonLogger((l) => lines.push(l)).log({ msg: "resolved", token: "abc", sessionId: "s1" }, "Sessions");
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(parsed).toMatchObject({ level: "log", context: "Sessions", msg: "resolved", sessionId: "s1", token: "[redacted]" });
    expect(lines[0]).not.toContain("abc");
  });

  it("drops stack traces on error", () => {
    const lines: string[] = [];
    new JsonLogger((l) => lines.push(l)).error({ msg: "boom" }, "Error: x\n at secret-input-value");
    expect(lines[0]).not.toContain("secret-input-value");
  });
});
