import { z } from "zod";
import { FIELD_KEYS } from "./fields.js";
import { SHARE_METHODS } from "./enums.js";
import { SESSION_STATUSES } from "./session-status.js";
import { QR_TOKEN_PATTERN, SHARE_CODE_PATTERN, QR_TTL_MINUTES, normalizeShareCode } from "./tokens.js";

export const fieldKeySchema = z.enum(FIELD_KEYS);
export const shareMethodSchema = z.enum(SHARE_METHODS);
export const sessionStatusSchema = z.enum(SESSION_STATUSES);

export const requestedFieldSchema = z.object({
  fieldKey: fieldKeySchema,
  required: z.boolean(),
});

export const createSessionSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a request name").max(80, "Use 80 characters or fewer"),
    purpose: z.string().trim().min(1, "Enter a purpose").max(120, "Use 120 characters or fewer"),
    explanation: z.string().trim().max(200, "Use 200 characters or fewer").optional(),
    method: shareMethodSchema,
    fields: z.array(requestedFieldSchema).min(1, "Select at least one field"),
    ttlMinutes: z.number().int().min(QR_TTL_MINUTES.min).max(QR_TTL_MINUTES.max).optional(),
  })
  .refine((v) => new Set(v.fields.map((f) => f.fieldKey)).size === v.fields.length, {
    message: "Each field can be requested once",
    path: ["fields"],
  });
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const resolveTokenSchema = z.object({
  token: z.string().regex(QR_TOKEN_PATTERN, "This QR code isn't a DataExchange request"),
});

export const resolveCodeSchema = z.object({
  code: z
    .string()
    .transform(normalizeShareCode)
    .pipe(z.string().regex(SHARE_CODE_PATTERN, "Enter the 6-digit code")),
});

export const decisionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVE"),
    approvedKeys: z.array(z.string()).min(1),
    idempotencyKey: z.uuid(),
  }),
  z.object({
    decision: z.literal("DECLINE"),
    idempotencyKey: z.uuid(),
  }),
]);
export type DecisionInput = z.infer<typeof decisionSchema>;
