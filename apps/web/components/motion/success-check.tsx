"use client";

import { m } from "motion/react";
import { duration, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReduced } from "./hooks";

const PARTICLES = 8;

/** Evenly spaced burst directions with alternating 24/36 px reach. */
export function particleVectors(count = PARTICLES): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const reach = i % 2 === 0 ? 36 : 24;
    return { x: Math.round(Math.cos(angle) * reach), y: Math.round(Math.sin(angle) * reach) };
  });
}

/**
 * Confirmed-success mark. ONLY render after a 2xx from the server — never on
 * failure, uncertainty, or decline. Circle pops in, the check draws, and
 * (customer app only) one particle burst plays. Reduced: static check.
 */
export function SuccessCheck({
  size = 72,
  particles = true,
  className,
  label = "Success",
}: {
  size?: number;
  particles?: boolean;
  className?: string;
  label?: string;
}) {
  const reduced = useReduced();
  const showParticles = particles && !reduced;

  return (
    <span role="img" aria-label={label} className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      {showParticles
        ? particleVectors().map((v, i) => (
            <m.span
              key={i}
              aria-hidden="true"
              className={cn("absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 rounded-full", i % 2 ? "bg-accent" : "bg-success")}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
              animate={{ x: v.x * (size / 72) * 1.4, y: v.y * (size / 72) * 1.4, opacity: [0, 1, 0], scale: 1 }}
              transition={{ duration: duration.celebrate, delay: 0.12, ease: "easeOut" }}
            />
          ))
        : null}
      <m.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-accent"
        initial={reduced ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={reduced ? { duration: duration.fast } : spring.pop}
      />
      <svg viewBox="0 0 24 24" className="relative m-auto text-accent-foreground" width={size * 0.5} height={size * 0.5} aria-hidden="true">
        <m.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduced ? { pathLength: 1, opacity: 0 } : { pathLength: 0 }}
          animate={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 1 }}
          transition={reduced ? { duration: duration.fast } : { duration: 0.4, delay: 0.15, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}
