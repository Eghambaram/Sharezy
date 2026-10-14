import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export type { CountryCode };

export const DEFAULT_PHONE_COUNTRY: CountryCode = "IN";

export function isCountryCode(v: string): v is CountryCode {
  return (getCountries() as string[]).includes(v);
}

export function callingCode(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`;
}

/** Splits a stored E.164 value for the country picker + national input. */
export function splitE164(value: string): { country: CountryCode; national: string } {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  if (parsed?.country) return { country: parsed.country, national: parsed.formatNational() };
  return { country: DEFAULT_PHONE_COUNTRY, national: "" };
}

/**
 * Combines country + typed digits into E.164. Unparseable input still yields
 * a "+<code><digits>" string so validation reports it, rather than silently
 * dropping what the person typed. Empty input → "".
 */
export function toE164(country: CountryCode, national: string): string {
  const trimmed = national.trim();
  if (trimmed === "") return "";
  const parsed = parsePhoneNumberFromString(trimmed, country);
  if (parsed) return parsed.number;
  return `${callingCode(country)}${trimmed.replace(/\D/g, "")}`;
}

/** "+91 98765 43210" for display; falls back to the raw value. */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
