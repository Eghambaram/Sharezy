import { describe, expect, it } from "vitest";
import {
  EMPTY_PROFILE,
  formToRecord,
  profileCompleteness,
  profileFieldValue,
  profileFormSchema,
  profilePatchSchema,
  profileRecordIssues,
  recordToForm,
  type ProfileRecord,
} from "./profile.js";

const full: ProfileRecord = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  phone: "+919876543210",
  addressLine1: "14 Lakeview Road",
  addressLine2: null,
  city: "Bengaluru",
  region: "Karnataka",
  postalCode: "560001",
  country: "IN",
};

const emptyForm = recordToForm(EMPTY_PROFILE);

describe("profilePatchSchema", () => {
  it("accepts a partial patch and turns blanks into null", () => {
    expect(profilePatchSchema.parse({ firstName: " Alex ", region: "  " })).toEqual({ firstName: "Alex", region: null });
  });

  it("rejects unknown keys (no mass assignment)", () => {
    expect(profilePatchSchema.safeParse({ firstName: "A", userId: "x" }).success).toBe(false);
  });

  it("validates real phone numbers, not just the shape", () => {
    expect(profilePatchSchema.safeParse({ phone: "+919876543210" }).success).toBe(true);
    expect(profilePatchSchema.safeParse({ phone: "+14165550123" }).success).toBe(true);
    expect(profilePatchSchema.safeParse({ phone: "+91123" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ phone: "9876543210" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ phone: "+910000000000" }).success).toBe(false);
  });

  it("validates email and country code", () => {
    expect(profilePatchSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ country: "India" }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ country: "IN" }).success).toBe(true);
  });
});

describe("profileRecordIssues", () => {
  it("is happy with no address at all", () => {
    expect(profileRecordIssues({ ...EMPTY_PROFILE, firstName: "A" })).toEqual([]);
  });

  it("requires the core parts once any address part is given", () => {
    const issues = profileRecordIssues({ ...EMPTY_PROFILE, city: "Pune" });
    expect(issues.map((i) => i.field)).toEqual(["addressLine1", "postalCode", "country"]);
  });
});

describe("profileFormSchema", () => {
  it("requires a name to save", () => {
    const r = profileFormSchema.safeParse(emptyForm);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0])).toEqual(["firstName", "lastName"]);
  });

  it("accepts name only", () => {
    expect(profileFormSchema.safeParse({ ...emptyForm, firstName: "Alex", lastName: "Morgan" }).success).toBe(true);
  });

  it("flags an incomplete address on the right fields", () => {
    const r = profileFormSchema.safeParse({ ...emptyForm, firstName: "A", lastName: "B", addressLine1: "1 Main St" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0])).toEqual(["city", "postalCode", "country"]);
  });

  it("round-trips through record form", () => {
    expect(formToRecord(recordToForm(full))).toEqual(full);
  });
});

describe("profileFieldValue / completeness", () => {
  it("builds shareable values", () => {
    expect(profileFieldValue(full, "FULL_NAME")).toBe("Alex Morgan");
    expect(profileFieldValue(full, "ADDRESS")).toEqual({
      line1: "14 Lakeview Road",
      line2: null,
      city: "Bengaluru",
      region: "Karnataka",
      postalCode: "560001",
      country: "IN",
    });
  });

  it("needs both names for FULL_NAME and core parts for ADDRESS", () => {
    expect(profileFieldValue({ ...full, lastName: null }, "FULL_NAME")).toBeNull();
    expect(profileFieldValue({ ...full, postalCode: null }, "ADDRESS")).toBeNull();
  });

  it("counts completeness over the field catalogue", () => {
    expect(profileCompleteness(full)).toEqual({ done: 4, total: 4, missing: [] });
    expect(profileCompleteness(EMPTY_PROFILE)).toEqual({
      done: 0,
      total: 4,
      missing: ["FULL_NAME", "MOBILE", "EMAIL", "ADDRESS"],
    });
  });
});
