"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";
import { transition } from "@/lib/motion";

/**
 * Root motion setup: `reducedMotion="user"` honours the OS setting, and
 * LazyMotion keeps the bundle small. `strict` forces `m.*` components so a
 * stray `motion.div` (which bundles every feature) fails loudly in dev.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={transition.standard}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
