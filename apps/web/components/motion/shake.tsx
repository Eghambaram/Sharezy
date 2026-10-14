"use client";

import { useAnimate } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { useReduced } from "./hooks";

/**
 * Shakes its children when `trigger` changes (e.g. an error count or key).
 * The error text itself must be rendered separately so it still appears in
 * reduced mode, where the shake is skipped.
 */
export function Shake({ trigger, children, className }: { trigger: unknown; children: ReactNode; className?: string }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useReduced();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced || trigger === null || trigger === undefined || !scope.current) return;
    void animate(scope.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.3, ease: "easeInOut" });
  }, [trigger, reduced, animate, scope]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
