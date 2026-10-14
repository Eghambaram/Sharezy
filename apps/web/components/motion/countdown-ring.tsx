"use client";

import { m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { countdownAnnouncement, countdownTone, formatCountdown, secondsUntil, type CountdownTone } from "./countdown";
import { useReduced } from "./hooks";

const TONE_STROKE: Record<CountdownTone, string> = {
  ok: "stroke-accent",
  warn: "stroke-warning",
  danger: "stroke-destructive",
  expired: "stroke-neutral",
};
const TONE_TEXT: Record<CountdownTone, string> = {
  ok: "text-foreground",
  warn: "text-warning-strong",
  danger: "text-destructive",
  expired: "text-muted-foreground",
};

/**
 * Ring that drains linearly to `expiresAt`, with a text timer alongside.
 * Colour shifts to amber at ≤ 60 s and red at ≤ 15 s. Announces only at the
 * one-minute mark and at expiry. Reduced: static ring updated each second.
 */
export function CountdownRing({
  expiresAt,
  totalSeconds,
  size = 40,
  stroke = 4,
  label = "Time left",
  onExpire,
  className,
  showText = true,
}: {
  expiresAt: Date;
  totalSeconds: number;
  size?: number;
  stroke?: number;
  label?: string;
  onExpire?: () => void;
  className?: string;
  showText?: boolean;
}) {
  const reduced = useReduced();
  // null until the first client tick: time-dependent markup must not be server-rendered (hydration).
  const [now, setNow] = useState<number | null>(null);
  // Deadline (ms) for which onExpire already fired; a new deadline re-arms it.
  const firedFor = useRef<number | null>(null);

  // Tick every second; restart (with an immediate tick) when the deadline changes, e.g. "New QR code".
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [expiresAt]);

  const ready = now !== null;
  const left = ready ? secondsUntil(expiresAt, now) : totalSeconds;
  const tone = ready ? countdownTone(left) : "ok";

  useEffect(() => {
    const deadline = expiresAt.getTime();
    if (ready && tone === "expired" && firedFor.current !== deadline) {
      firedFor.current = deadline;
      onExpire?.();
    }
  }, [ready, tone, expiresAt, onExpire]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fraction = totalSeconds > 0 ? Math.min(1, left / totalSeconds) : 0;
  const offsetNow = c * (1 - fraction);
  const announcement = ready ? countdownAnnouncement(left) : null;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
        {!ready ? null : reduced ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offsetNow}
            className={TONE_STROKE[tone]}
          />
        ) : (
          <m.circle
            // Re-key per deadline so the linear drain restarts cleanly.
            key={expiresAt.getTime()}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: offsetNow }}
            animate={{ strokeDashoffset: c }}
            transition={{ duration: left, ease: "linear" }}
            className={cn(TONE_STROKE[tone], "transition-[stroke] duration-200")}
          />
        )}
      </svg>
      {showText ? (
        <span className={cn("tabular text-sm font-medium", TONE_TEXT[tone])}>
          <span className="sr-only">{label}: </span>
          <span aria-hidden="true">{ready ? formatCountdown(left) : "–:––"}</span>
        </span>
      ) : null}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement ?? ""}
      </span>
    </span>
  );
}
