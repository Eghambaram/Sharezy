/**
 * Motion tokens — the ONLY source of durations, easings, springs and distances
 * (PROMPT.md §12.2). Durations are in seconds (Motion's unit).
 */
import type { Transition } from "motion/react";

export const duration = { instant: 0.1, fast: 0.15, standard: 0.22, slow: 0.3, celebrate: 0.6 } as const;

export const ease = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const spring = {
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.8 },
  gentle: { type: "spring", stiffness: 260, damping: 28 },
  pop: { type: "spring", stiffness: 420, damping: 18 },
} as const satisfies Record<string, Transition>;

export const stagger = { list: 0.035, digits: 0.05, maxItems: 8 } as const;

/** px */
export const distance = { step: 24, rise: 8, nudge: 4 } as const;

export const transition = {
  standard: { duration: duration.standard, ease: ease.standard },
  enter: { duration: duration.standard, ease: ease.emphasized },
  exit: { duration: duration.fast, ease: ease.exit },
  /** Reduced-motion fallback: opacity-only, ≤ 150 ms. */
  reduced: { duration: duration.fast, ease: "linear" },
} as const satisfies Record<string, Transition>;

/** Countdown thresholds (seconds) for colour shifts and announcements. */
export const countdown = { warnAt: 60, dangerAt: 15 } as const;

/** Loops (pulse, viewfinder, scan line). */
export const loop = { pulse: 2, breathe: 2.4, scanLine: 1.8 } as const;
