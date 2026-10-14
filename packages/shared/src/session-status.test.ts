import { describe, expect, it } from "vitest";
import {
  InvalidTransitionError,
  SESSION_EVENTS,
  SESSION_STATUSES,
  TERMINAL_STATUSES,
  assertTransition,
  canTransition,
  effectiveStatus,
  nextStatus,
} from "./session-status.js";

describe("session status machine", () => {
  it.each([
    ["WAITING", "RESOLVE", "IN_REVIEW"],
    ["WAITING", "CANCEL", "CANCELLED"],
    ["WAITING", "EXPIRE", "EXPIRED"],
    ["IN_REVIEW", "APPROVE", "APPROVED"],
    ["IN_REVIEW", "DECLINE", "DECLINED"],
    ["IN_REVIEW", "CANCEL", "CANCELLED"],
    ["IN_REVIEW", "EXPIRE", "EXPIRED"],
    ["APPROVED", "COMPLETE", "COMPLETED"],
  ] as const)("%s --%s--> %s", (from, event, to) => {
    expect(nextStatus(from, event)).toBe(to);
  });

  it("terminal states have no outgoing transitions", () => {
    for (const s of TERMINAL_STATUSES) {
      for (const e of SESSION_EVENTS) expect(canTransition(s, e)).toBe(false);
    }
  });

  it("APPROVED can only move to COMPLETED", () => {
    const allowed = SESSION_EVENTS.filter((e) => canTransition("APPROVED", e));
    expect(allowed).toEqual(["COMPLETE"]);
  });

  it("cannot approve from WAITING (must be resolved first)", () => {
    expect(() => assertTransition("WAITING", "APPROVE")).toThrow(InvalidTransitionError);
  });

  it("covers every status", () => {
    for (const s of SESSION_STATUSES) expect(() => canTransition(s, "EXPIRE")).not.toThrow();
  });
});

describe("effectiveStatus", () => {
  const past = new Date("2026-01-01T00:00:00Z");
  const now = new Date("2026-01-01T00:00:01Z");

  it("reports EXPIRED for WAITING/IN_REVIEW past expiresAt", () => {
    expect(effectiveStatus("WAITING", past, now)).toBe("EXPIRED");
    expect(effectiveStatus("IN_REVIEW", past, now)).toBe("EXPIRED");
  });

  it("treats the exact expiry instant as expired", () => {
    expect(effectiveStatus("WAITING", now, now)).toBe("EXPIRED");
  });

  it("does not rewrite decided sessions", () => {
    expect(effectiveStatus("APPROVED", past, now)).toBe("APPROVED");
    expect(effectiveStatus("DECLINED", past, now)).toBe("DECLINED");
  });
});
