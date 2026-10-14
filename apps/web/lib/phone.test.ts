import { formatPhone, splitE164, toE164 } from "./phone";

describe("phone helpers", () => {
  it("combines country + national digits into E.164", () => {
    expect(toE164("IN", "98765 43210")).toBe("+919876543210");
    expect(toE164("CA", "(416) 555-0123")).toBe("+14165550123");
  });

  it("returns empty for empty input", () => {
    expect(toE164("IN", "   ")).toBe("");
  });

  it("keeps unparseable input visible to validation instead of dropping it", () => {
    expect(toE164("IN", "12")).toBe("+9112");
  });

  it("splits stored E.164 for editing, defaulting to India", () => {
    expect(splitE164("+14165550123")).toEqual({ country: "CA", national: "(416) 555-0123" });
    expect(splitE164("")).toEqual({ country: "IN", national: "" });
  });

  it("formats for display", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });
});
