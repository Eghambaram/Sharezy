"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { distance, transition } from "@/lib/motion";
import { useReduced } from "./hooks";

/**
 * "You're sharing **3** of 5 requested fields" — the number rolls up when it
 * increases and down when it decreases. Screen readers get a polite update of
 * the whole sentence.
 */
export function AnimatedNumberText({
  value,
  total,
  before = "You're sharing",
  after = "requested fields",
  className,
}: {
  value: number;
  total: number;
  before?: string;
  after?: string;
  className?: string;
}) {
  const reduced = useReduced();
  // Derive roll direction from the previous value (React's "store info from previous renders" pattern).
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState<1 | -1>(1);
  if (value !== prev) {
    setDir(value > prev ? 1 : -1);
    setPrev(value);
  }

  return (
    <p className={className}>
      <span aria-hidden="true">
        {before}{" "}
        <span className="relative inline-flex overflow-hidden align-bottom tabular font-semibold">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <m.span
              key={value}
              custom={dir}
              initial={reduced ? false : { y: dir * distance.rise * 1.5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { y: dir * -distance.rise * 1.5, opacity: 0 }}
              transition={reduced ? { duration: 0 } : transition.standard}
            >
              {value}
            </m.span>
          </AnimatePresence>
        </span>{" "}
        of {total} {after}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {`${before} ${value} of ${total} ${after}`}
      </span>
    </p>
  );
}
