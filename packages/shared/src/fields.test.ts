import { describe, expect, it } from "vitest";
import { FIELD_CATALOG, FIELD_KEYS, isFieldKey, validateApprovedSet, type RequestedFieldSpec } from "./fields.js";

const requested: RequestedFieldSpec[] = [
  { fieldKey: "FULL_NAME", required: true },
  { fieldKey: "MOBILE", required: true },
  { fieldKey: "EMAIL", required: false },
  { fieldKey: "ADDRESS", required: false },
];

describe("FIELD_CATALOG", () => {
  it("has an entry for every key and nothing else", () => {
    expect(Object.keys(FIELD_CATALOG).sort()).toEqual([...FIELD_KEYS].sort());
    for (const key of FIELD_KEYS) expect(FIELD_CATALOG[key].key).toBe(key);
  });

  it("does not include out-of-scope fields", () => {
    for (const banned of ["DOB", "DATE_OF_BIRTH", "GOVERNMENT_ID", "DRIVERS_LICENCE", "EMERGENCY_CONTACT"]) {
      expect(isFieldKey(banned)).toBe(false);
    }
  });
});

describe("validateApprovedSet", () => {
  it("accepts required ⊆ approved ⊆ requested and returns catalogue order", () => {
    const r = validateApprovedSet(requested, ["EMAIL", "MOBILE", "FULL_NAME"]);
    expect(r).toEqual({ ok: true, approved: ["FULL_NAME", "MOBILE", "EMAIL"] });
  });

  it("accepts exactly the required set", () => {
    expect(validateApprovedSet(requested, ["FULL_NAME", "MOBILE"]).ok).toBe(true);
  });

  it("rejects keys outside the catalogue", () => {
    const r = validateApprovedSet(requested, ["FULL_NAME", "MOBILE", "SSN"]);
    expect(r).toEqual({ ok: false, error: { code: "FIELD_NOT_ALLOWED", keys: ["SSN"] } });
  });

  it("rejects catalogue keys that were not requested", () => {
    const r = validateApprovedSet([{ fieldKey: "FULL_NAME", required: true }], ["FULL_NAME", "EMAIL"]);
    expect(r).toEqual({ ok: false, error: { code: "FIELD_NOT_REQUESTED", keys: ["EMAIL"] } });
  });

  it("rejects when a required field is missing", () => {
    const r = validateApprovedSet(requested, ["FULL_NAME", "EMAIL"]);
    expect(r).toEqual({ ok: false, error: { code: "REQUIRED_FIELD_MISSING", keys: ["MOBILE"] } });
  });

  it("rejects duplicates", () => {
    const r = validateApprovedSet(requested, ["FULL_NAME", "MOBILE", "MOBILE"]);
    expect(r).toEqual({ ok: false, error: { code: "DUPLICATE_FIELD", keys: ["MOBILE"] } });
  });

  it("rejects prototype-ish keys", () => {
    const r = validateApprovedSet(requested, ["__proto__", "FULL_NAME", "MOBILE"]);
    expect(r.ok).toBe(false);
  });
});
