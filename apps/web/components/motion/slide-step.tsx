"use client";

import { AnimatePresence, m, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { distance, transition } from "@/lib/motion";
import { useReduced } from "./hooks";

export type StepDirection = 1 | -1;

const variants: Variants = {
  enter: (dir: StepDirection) => ({ opacity: 0, x: dir * distance.step }),
  center: { opacity: 1, x: 0, transition: transition.enter },
  exit: (dir: StepDirection) => ({ opacity: 0, x: dir * -distance.step, transition: transition.exit }),
};

const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: transition.reduced },
  exit: { opacity: 0, transition: transition.reduced },
};

/**
 * Direction-aware step transition for flows and wizards. Pass `direction={-1}`
 * when going back so the motion reverses. Entering and leaving steps overlap
 * (`popLayout`) so the change stays within the 300 ms step budget.
 */
export function SlideStep({
  stepKey,
  direction,
  children,
  className,
}: {
  stepKey: string | number;
  direction: StepDirection;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReduced();
  return (
    <div className={className} style={{ position: "relative" }}>
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <m.div
          key={stepKey}
          custom={direction}
          variants={reduced ? reducedVariants : variants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
