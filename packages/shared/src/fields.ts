/**
 * FIELD_CATALOG — the allowlist of personal-data fields a business may request.
 *
 * Any key not listed here is rejected with FIELD_NOT_ALLOWED on session create
 * and on consent decision. Adding a field requires a catalogue entry, a
 * validation schema, and an ADR justifying the use case (PROMPT.md §7.2).
 */

export const FIELD_KEYS = ["FULL_NAME", "MOBILE", "EMAIL", "ADDRESS"] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const FIELD_CATEGORIES = ["NAME", "CONTACT", "ADDRESS"] as const;
export type FieldCategory = (typeof FIELD_CATEGORIES)[number];

export const FIELD_CATEGORY_LABELS: Readonly<Record<FieldCategory, string>> = {
  NAME: "Name",
  CONTACT: "Contact",
  ADDRESS: "Address",
};

export interface FieldDefinition {
  readonly key: FieldKey;
  readonly label: string;
  readonly category: FieldCategory;
  /** Short, plain description shown to customers when reviewing a request. */
  readonly description: string;
}

export const FIELD_CATALOG: Readonly<Record<FieldKey, FieldDefinition>> = {
  FULL_NAME: {
    key: "FULL_NAME",
    label: "Full name",
    category: "NAME",
    description: "Your first and last name.",
  },
  MOBILE: {
    key: "MOBILE",
    label: "Mobile number",
    category: "CONTACT",
    description: "Your mobile number, including country code.",
  },
  EMAIL: {
    key: "EMAIL",
    label: "Email address",
    category: "CONTACT",
    description: "Your email address.",
  },
  ADDRESS: {
    key: "ADDRESS",
    label: "Postal address",
    category: "ADDRESS",
    description: "Your street address, city, region, postal code, and country.",
  },
};

const FIELD_KEY_SET: ReadonlySet<string> = new Set(FIELD_KEYS);

export function isFieldKey(value: unknown): value is FieldKey {
  return typeof value === "string" && FIELD_KEY_SET.has(value);
}

export interface RequestedFieldSpec {
  readonly fieldKey: FieldKey;
  readonly required: boolean;
}

export type ApprovedSetError =
  | { readonly code: "FIELD_NOT_ALLOWED"; readonly keys: readonly string[] }
  | { readonly code: "FIELD_NOT_REQUESTED"; readonly keys: readonly string[] }
  | { readonly code: "REQUIRED_FIELD_MISSING"; readonly keys: readonly string[] }
  | { readonly code: "DUPLICATE_FIELD"; readonly keys: readonly string[] };

export type ApprovedSetResult =
  | { readonly ok: true; readonly approved: readonly FieldKey[] }
  | { readonly ok: false; readonly error: ApprovedSetError };

/**
 * Enforces the approved-set rule: required ⊆ approved ⊆ requested,
 * with every key in FIELD_CATALOG and no duplicates.
 *
 * The returned `approved` list is ordered by catalogue order so receipts are
 * stable regardless of client ordering.
 */
export function validateApprovedSet(
  requested: readonly RequestedFieldSpec[],
  approvedKeys: readonly string[],
): ApprovedSetResult {
  const unknown = approvedKeys.filter((k) => !isFieldKey(k));
  if (unknown.length > 0) {
    return { ok: false, error: { code: "FIELD_NOT_ALLOWED", keys: unknown } };
  }

  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const k of approvedKeys) {
    if (seen.has(k)) dupes.add(k);
    seen.add(k);
  }
  if (dupes.size > 0) {
    return { ok: false, error: { code: "DUPLICATE_FIELD", keys: [...dupes] } };
  }

  const requestedKeys = new Set<string>(requested.map((f) => f.fieldKey));
  const notRequested = approvedKeys.filter((k) => !requestedKeys.has(k));
  if (notRequested.length > 0) {
    return { ok: false, error: { code: "FIELD_NOT_REQUESTED", keys: notRequested } };
  }

  const missingRequired = requested
    .filter((f) => f.required && !seen.has(f.fieldKey))
    .map((f) => f.fieldKey);
  if (missingRequired.length > 0) {
    return { ok: false, error: { code: "REQUIRED_FIELD_MISSING", keys: missingRequired } };
  }

  const approved = FIELD_KEYS.filter((k) => seen.has(k));
  return { ok: true, approved };
}
