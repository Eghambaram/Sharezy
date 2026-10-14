import { z } from "zod";
import { CONSENT_DECISIONS, ROLES } from "./enums.js";
import { FIELD_KEYS } from "./fields.js";

/** GET /v1/me */
export const meSchema = z.object({
  id: z.string(),
  /** Present only when the auth provider verified it. */
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  phone: z.string().nullable(),
  phoneVerified: z.boolean(),
  isSample: z.boolean(),
  memberships: z.array(
    z.object({
      organizationId: z.string(),
      organizationName: z.string(),
      role: z.enum(ROLES),
      isSample: z.boolean(),
    }),
  ),
});
export type Me = z.infer<typeof meSchema>;

/** GET /v1/dev-auth/users (AUTH_MODE=dev only) */
export const devUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  kind: z.enum(["business", "customer"]),
  organizationName: z.string().nullable(),
});
export const devUsersSchema = z.array(devUserSchema);
export type DevUser = z.infer<typeof devUserSchema>;

/** POST /v1/dev-auth/token (AUTH_MODE=dev only) */
export const devTokenSchema = z.object({ token: z.string(), expiresAt: z.iso.datetime() });
export type DevToken = z.infer<typeof devTokenSchema>;

/** GET /v1/me/activity — the customer's own consent decisions. */
export const activityItemSchema = z.object({
  grantId: z.string(),
  receiptId: z.string(),
  organizationName: z.string(),
  purpose: z.string(),
  decision: z.enum(CONSENT_DECISIONS),
  requestedKeys: z.array(z.enum(FIELD_KEYS)),
  sharedKeys: z.array(z.enum(FIELD_KEYS)),
  decidedAt: z.iso.datetime(),
  isSample: z.boolean(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const activityPageSchema = z.object({
  items: z.array(activityItemSchema),
  nextCursor: z.string().nullable(),
});
export type ActivityPage = z.infer<typeof activityPageSchema>;
