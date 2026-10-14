"use client";

import { m } from "motion/react";
import { loop } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { usePageVisible, useReduced } from "./hooks";

const TONE: Record<"accent" | "neutral" | "warning", string> = {
  accent: "bg-accent",
  neutral: "bg-neutral",
  warning: "bg-warning",
};

/**
 * 8 px dot with an expanding ring (2 s loop). Pauses while the tab is hidden;
 * static dot in reduced mode. Decorative — pair it with visible status text.
 */
export function StatusPulse({ tone = "accent", className }: { tone?: keyof typeof TONE; className?: string }) {
  const reduced = useReduced();
  const visible = usePageVisible();
  const animateRing = !reduced && visible;

  return (
    <span aria-hidden="true" className={cn("relative inline-flex size-2", className)}>
      {animateRing ? (
        <m.span
          className={cn("absolute inset-0 rounded-full", TONE[tone])}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: loop.pulse, ease: "easeOut", repeat: Infinity }}
        />
      ) : null}
      <span className={cn("relative inline-flex size-2 rounded-full", TONE[tone])} />
    </span>
  );
}
