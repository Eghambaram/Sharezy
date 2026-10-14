import { z } from "zod";

/**
 * Stable API error codes. The UI maps codes to copy and never shows raw
 * server messages. Envelope: `{ error: { code, message, retryable } }`.
 */
export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "RATE_LIMITED",
  "INTERNAL",
  "FIELD_NOT_ALLOWED",
  "FIELD_NOT_REQUESTED",
  "REQUIRED_FIELD_MISSING",
  "DUPLICATE_FIELD",
  "PROFILE_FIELD_MISSING",
  "SHARE_CODE_INVALID_OR_EXPIRED",
  "QR_TOKEN_INVALID_OR_EXPIRED",
  "SESSION_UNAVAILABLE",
  "SESSION_EXPIRED",
  "SESSION_ALREADY_DECIDED",
  "SESSION_INVALID_STATE",
  "ORG_MEMBERSHIP_REQUIRED",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
