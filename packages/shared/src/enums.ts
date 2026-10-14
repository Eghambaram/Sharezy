export const ROLES = ["OWNER", "ADMIN", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

const ROLE_RANK: Readonly<Record<Role, number>> = { STAFF: 1, ADMIN: 2, OWNER: 3 };

/** True if `role` has at least the privileges of `minimum` (OWNER ⊃ ADMIN ⊃ STAFF). */
export function hasRoleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export const SHARE_METHODS = ["QR", "CODE"] as const;
export type ShareMethod = (typeof SHARE_METHODS)[number];

export const SHARE_METHOD_LABELS: Readonly<Record<ShareMethod, string>> = {
  QR: "QR code (in person)",
  CODE: "Share code (phone or remote)",
};

export const CONSENT_DECISIONS = ["APPROVED", "DECLINED"] as const;
export type ConsentDecision = (typeof CONSENT_DECISIONS)[number];

export const AUTH_MODES = ["clerk", "dev"] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

/** Version of the customer-facing consent text; snapshotted on every grant. */
export const CONSENT_TEXT_VERSION = "2026-10-01";

export const AUDIT_EVENT_TYPES = [
  "SESSION_CREATED",
  "SESSION_REGENERATED",
  "SESSION_CANCELLED",
  "SESSION_EXPIRED",
  "SESSION_RESOLVED",
  "CODE_REDEEM_FAILED",
  "CONSENT_APPROVED",
  "CONSENT_DECLINED",
  "SHARED_DATA_VIEWED",
  "RECORD_SAVED",
  "RECORD_UPDATED",
  "RECEIPT_EXPORTED",
  "ORG_CREATED",
  "ORG_UPDATED",
  "MEMBER_INVITED",
  "MEMBER_JOINED",
  "MEMBER_ROLE_CHANGED",
  "MEMBER_REMOVED",
  "PROFILE_UPDATED",
  "ACCOUNT_DELETED",
  "USER_CREATED",
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];
