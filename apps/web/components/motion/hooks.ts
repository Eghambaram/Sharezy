"use client";

import { useReducedMotionConfig } from "motion/react";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * True when motion should be reduced — from the OS setting or an enclosing
 * `<MotionConfig reducedMotion="always">`. Use for custom sequences that
 * MotionConfig can't reduce on its own (loops, count-ups, particles).
 *
 * Hydration-safe: reports false until hydrated so server and client render the
 * same markup. MotionConfig (reducedMotion="user") already suppresses
 * transform animation during that first frame.
 */
export function useReduced(): boolean {
  const reduced = useReducedMotionConfig() === true;
  return useHydrated() && reduced;
}

function subscribeVisibility(cb: () => void): () => void {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

/** False while the tab is hidden. Looping animations pause on false. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}
