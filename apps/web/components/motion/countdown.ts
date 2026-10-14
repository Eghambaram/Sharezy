import { countdown } from "@/lib/motion";

export type CountdownTone = "ok" | "warn" | "danger" | "expired";

export function countdownTone(secondsLeft: number): CountdownTone {
  if (secondsLeft <= 0) return "expired";
  if (secondsLeft <= countdown.dangerAt) return "danger";
  if (secondsLeft <= countdown.warnAt) return "warn";
  return "ok";
}

/** "14:59", "0:05", "0:00". */
export function formatCountdown(secondsLeft: number): string {
  const s = Math.max(0, Math.ceil(secondsLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function secondsUntil(expiresAt: Date, now: number): number {
  return Math.max(0, (expiresAt.getTime() - now) / 1000);
}

/**
 * What to announce to screen readers. Only at the one-minute mark and at
 * expiry — never every second (PROMPT.md §11).
 */
export function countdownAnnouncement(secondsLeft: number): string | null {
  if (secondsLeft <= 0) return "This request has expired.";
  if (secondsLeft <= countdown.warnAt) return "One minute left.";
  return null;
}
