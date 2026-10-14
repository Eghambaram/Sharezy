import { isValidPhoneNumber } from "libphonenumber-js/min";
import { z } from "zod";
import { FIELD_KEYS, type FieldKey } from "./fields.js";

/**
 * Customer profile contract (PROMPT.md §7.1, C04, C13). One set of rules for
 * the web form and the API, so validation can't drift.
 */

export const PROFILE_TEXT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "region",
  "postalCode",
  "country",
] as const;
export type ProfileTextField = (typeof PROFILE_TEXT_FIELDS)[number];

/** Stored shape: every field optional (null = not provided). */
export type ProfileRecord = Record<ProfileTextField, string | null>;

export const EMPTY_PROFILE: ProfileRecord = Object.fromEntries(PROFILE_TEXT_FIELDS.map((f) => [f, null])) as ProfileRecord;

// ── Field rules ─────────────────────────────────────────────────────────────

const name = (label: string) =>
  z.string().trim().min(1, `Enter your ${label}`).max(60, "Use 60 characters or fewer");

/** E.164, and a real number plan for its country (not just the right shape). */
export const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid mobile number with country code")
  .refine((v) => isValidPhoneNumber(v), "Enter a valid mobile number with country code");

const email = z.email("Enter a valid email address").max(254, "Use 254 characters or fewer");
const countryCode = z.string().regex(/^[A-Z]{2}$/, "Choose a country");

const FIELD_RULES = {
  firstName: name("first name"),
  lastName: name("last name"),
  email,
  phone: phoneE164Schema,
  addressLine1: z.string().trim().min(1, "Enter the first line of your address").max(120, "Use 120 characters or fewer"),
  addressLine2: z.string().trim().max(120, "Use 120 characters or fewer"),
  city: z.string().trim().min(1, "Enter your city or town").max(80, "Use 80 characters or fewer"),
  region: z.string().trim().max(80, "Use 80 characters or fewer"),
  postalCode: z.string().trim().min(1, "Enter your postal code").max(20, "Use 20 characters or fewer"),
  country: countryCode,
} satisfies Record<ProfileTextField, z.ZodType<string>>;

/** Address parts that must all be present once any address part is given. */
export const ADDRESS_REQUIRED_PARTS = ["addressLine1", "city", "postalCode", "country"] as const;
const ADDRESS_PARTS = ["addressLine1", "addressLine2", "city", "region", "postalCode", "country"] as const;

export interface ProfileIssue {
  readonly field: ProfileTextField;
  readonly message: string;
}

/** Record-level rules (after a patch is merged): a partial address must be completed. */
export function profileRecordIssues(p: ProfileRecord): ProfileIssue[] {
  const anyAddress = ADDRESS_PARTS.some((k) => p[k] !== null);
  if (!anyAddress) return [];
  const messages: Record<(typeof ADDRESS_REQUIRED_PARTS)[number], string> = {
    addressLine1: "Enter the first line of your address",
    city: "Enter your city or town",
    postalCode: "Enter your postal code",
    country: "Choose a country",
  };
  return ADDRESS_REQUIRED_PARTS.filter((k) => p[k] === null).map((field) => ({ field, message: messages[field] }));
}

// ── API: PATCH /v1/me/profile ───────────────────────────────────────────────

const blankToNull = (v: unknown): unknown => (typeof v === "string" && v.trim() === "" ? null : v);
const patchField = <S extends z.ZodType<string>>(rule: S) => z.preprocess(blankToNull, rule.nullable()).optional();

/** Partial update. Omitted = unchanged; null or "" = clear. Unknown keys rejected. */
export const profilePatchSchema = z.strictObject({
  firstName: patchField(FIELD_RULES.firstName),
  lastName: patchField(FIELD_RULES.lastName),
  email: patchField(FIELD_RULES.email),
  phone: patchField(FIELD_RULES.phone),
  addressLine1: patchField(FIELD_RULES.addressLine1),
  addressLine2: patchField(FIELD_RULES.addressLine2),
  city: patchField(FIELD_RULES.city),
  region: patchField(FIELD_RULES.region),
  postalCode: patchField(FIELD_RULES.postalCode),
  country: patchField(FIELD_RULES.country),
});
export type ProfilePatch = z.infer<typeof profilePatchSchema>;

// ── Web form ────────────────────────────────────────────────────────────────

const optionalText = <S extends z.ZodType<string>>(rule: S) => z.union([z.literal(""), rule]);

/** Form values are plain strings ("" = empty). Name is required to save. */
export const profileFormSchema = z
  .object({
    firstName: FIELD_RULES.firstName,
    lastName: FIELD_RULES.lastName,
    email: optionalText(FIELD_RULES.email),
    phone: optionalText(FIELD_RULES.phone),
    addressLine1: z.string().trim().max(120, "Use 120 characters or fewer"),
    addressLine2: optionalText(FIELD_RULES.addressLine2),
    city: z.string().trim().max(80, "Use 80 characters or fewer"),
    region: optionalText(FIELD_RULES.region),
    postalCode: z.string().trim().max(20, "Use 20 characters or fewer"),
    country: optionalText(FIELD_RULES.country),
  })
  .superRefine((v, ctx) => {
    for (const issue of profileRecordIssues(formToRecord(v))) {
      ctx.addIssue({ code: "custom", path: [issue.field], message: issue.message });
    }
  });
export type ProfileFormValues = z.input<typeof profileFormSchema>;

export function formToRecord(v: Record<ProfileTextField, string>): ProfileRecord {
  return Object.fromEntries(PROFILE_TEXT_FIELDS.map((k) => [k, v[k].trim() === "" ? null : v[k].trim()])) as ProfileRecord;
}

export function recordToForm(p: ProfileRecord): Record<ProfileTextField, string> {
  return Object.fromEntries(PROFILE_TEXT_FIELDS.map((k) => [k, p[k] ?? ""])) as Record<ProfileTextField, string>;
}

// ── Shareable values and completeness ───────────────────────────────────────

export interface AddressValue {
  readonly line1: string;
  readonly line2: string | null;
  readonly city: string;
  readonly region: string | null;
  readonly postalCode: string;
  readonly country: string;
}

export type FieldValue = string | AddressValue;

/**
 * The value a field key would share from this profile, or null if the
 * profile can't supply it. Used for previews, completeness, and (Phase 5)
 * the consent snapshot.
 */
export function profileFieldValue(p: ProfileRecord, key: FieldKey): FieldValue | null {
  switch (key) {
    case "FULL_NAME":
      return p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : null;
    case "MOBILE":
      return p.phone;
    case "EMAIL":
      return p.email;
    case "ADDRESS":
      return p.addressLine1 && p.city && p.postalCode && p.country
        ? { line1: p.addressLine1, line2: p.addressLine2, city: p.city, region: p.region, postalCode: p.postalCode, country: p.country }
        : null;
  }
}

export function profileCompleteness(p: ProfileRecord): { done: number; total: number; missing: FieldKey[] } {
  const missing = FIELD_KEYS.filter((k) => profileFieldValue(p, k) === null);
  return { done: FIELD_KEYS.length - missing.length, total: FIELD_KEYS.length, missing };
}

// ── API response: GET/PATCH /v1/me/profile ──────────────────────────────────

const nullableText = z.string().nullable();

export const profileViewSchema = z.object({
  profile: z.object(Object.fromEntries(PROFILE_TEXT_FIELDS.map((k) => [k, nullableText])) as Record<ProfileTextField, typeof nullableText>),
  /** True only when the value equals a contact the auth provider verified. */
  verified: z.object({ email: z.boolean(), phone: z.boolean() }),
  completeness: z.object({ done: z.number().int(), total: z.number().int(), missing: z.array(z.enum(FIELD_KEYS)) }),
  /** False until the customer first saves their profile. */
  saved: z.boolean(),
  updatedAt: z.iso.datetime().nullable(),
});
export type ProfileView = z.infer<typeof profileViewSchema>;
