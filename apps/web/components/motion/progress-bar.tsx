"use client";

import { m } from "motion/react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReduced } from "./hooks";

/**
 * Determinate progress. Animates `scaleX` (transform only) from the left.
 * Reduced: jumps to the value. Pair with visible text — this is decorative.
 */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const reduced = useReduced();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <span aria-hidden="true" className={cn("block h-2 overflow-hidden rounded-full bg-surface-2", className)}>
      <m.span
        className="block h-full origin-left rounded-full bg-accent"
        initial={false}
        animate={{ scaleX: clamped }}
        transition={reduced ? { duration: 0 } : transition.standard}
      />
    </span>
  );
}
