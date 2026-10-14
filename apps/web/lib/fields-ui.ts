import { Mail, MapPin, Phone, UserRound, type LucideIcon } from "lucide-react";
import { FIELD_CATALOG, type FieldKey, type FieldValue } from "@dx/shared";
import { formatPhone } from "./phone";
import { countryName } from "./countries";

export const FIELD_ICONS: Readonly<Record<FieldKey, LucideIcon>> = {
  FULL_NAME: UserRound,
  MOBILE: Phone,
  EMAIL: Mail,
  ADDRESS: MapPin,
};

export function fieldLabel(key: FieldKey): string {
  return FIELD_CATALOG[key].label;
}

/** Human-readable value for the owner's own screens. */
export function formatFieldValue(key: FieldKey, value: FieldValue | null): string | null {
  if (value === null) return null;
  if (typeof value === "string") return key === "MOBILE" ? formatPhone(value) : value;
  return [value.line1, value.line2, value.city, value.region, value.postalCode, countryName(value.country)]
    .filter(Boolean)
    .join(", ");
}
