/**
 * Share-session status machine (PROMPT.md §7.3).
 *
 * WAITING ──resolve──▶ IN_REVIEW ──approve──▶ APPROVED ──save record──▶ COMPLETED
 *    │                    │  └──decline──▶ DECLINED
 *    ├─cancel─▶ CANCELLED ◀┘
 *    └─expiresAt passed─▶ EXPIRED (from WAITING or IN_REVIEW)
 *
 * All session state changes on the API go through `assertTransition`.
 */

export const SESSION_STATUSES = [
  "WAITING",
  "IN_REVIEW",
  "APPROVED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_EVENTS = ["RESOLVE", "APPROVE", "DECLINE", "CANCEL", "EXPIRE", "COMPLETE"] as const;
export type SessionEvent = (typeof SESSION_EVENTS)[number];

const TRANSITIONS: Readonly<Record<SessionStatus, Partial<Record<SessionEvent, SessionStatus>>>> = {
  WAITING: { RESOLVE: "IN_REVIEW", CANCEL: "CANCELLED", EXPIRE: "EXPIRED" },
  IN_REVIEW: { APPROVE: "APPROVED", DECLINE: "DECLINED", CANCEL: "CANCELLED", EXPIRE: "EXPIRED" },
  APPROVED: { COMPLETE: "COMPLETED" },
  DECLINED: {},
  EXPIRED: {},
  CANCELLED: {},
  COMPLETED: {},
};

export const TERMINAL_STATUSES: ReadonlySet<SessionStatus> = new Set([
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
  "COMPLETED",
]);

/** Statuses counted as "Pending" on the dashboard. */
export const PENDING_STATUSES: ReadonlySet<SessionStatus> = new Set(["WAITING", "IN_REVIEW"]);

/** Statuses where the expiry clock still applies. */
export const EXPIRABLE_STATUSES: ReadonlySet<SessionStatus> = new Set(["WAITING", "IN_REVIEW"]);

/** Statuses in which approved data may be released to the business. */
export const DATA_RELEASABLE_STATUSES: ReadonlySet<SessionStatus> = new Set(["APPROVED", "COMPLETED"]);

export const SESSION_STATUS_LABELS: Readonly<Record<SessionStatus, string>> = {
  WAITING: "Waiting",
  IN_REVIEW: "Customer reviewing",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export function nextStatus(from: SessionStatus, event: SessionEvent): SessionStatus | null {
  return TRANSITIONS[from][event] ?? null;
}

export function canTransition(from: SessionStatus, event: SessionEvent): boolean {
  return nextStatus(from, event) !== null;
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: SessionStatus,
    readonly event: SessionEvent,
  ) {
    super(`Invalid session transition: ${event} from ${from}`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: SessionStatus, event: SessionEvent): SessionStatus {
  const to = nextStatus(from, event);
  if (to === null) throw new InvalidTransitionError(from, event);
  return to;
}

export function isTerminal(status: SessionStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * The effective status, accounting for expiry. Read paths use this so
 * correctness never depends on the background sweeper having run.
 */
export function effectiveStatus(status: SessionStatus, expiresAt: Date, now: Date = new Date()): SessionStatus {
  if (EXPIRABLE_STATUSES.has(status) && now.getTime() >= expiresAt.getTime()) return "EXPIRED";
  return status;
}
