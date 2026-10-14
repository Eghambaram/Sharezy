"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReduced } from "./hooks";

/**
 * Tweens 0→value once per mount (600 ms). Screen readers get the final value
 * immediately; the animated digits are hidden from them. Reduced: final value.
 */
export function CountUp({
  value,
  className,
  format = (n) => n.toLocaleString(),
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const reduced = useReduced();
  const [shown, setShown] = useState(reduced ? value : 0);
  const played = useRef(false);

  useEffect(() => {
    if (reduced || played.current) {
      setShown(value);
      return;
    }
    played.current = true;
    const controls = animate(0, value, {
      duration: duration.celebrate,
      ease: ease.standard,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span className={cn("tabular", className)}>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
