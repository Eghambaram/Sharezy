"use client";

import { m } from "motion/react";
import { Children, type ElementType, type ReactNode } from "react";
import { distance, stagger, transition } from "@/lib/motion";
import { useReduced } from "./hooks";

/** Delay for item `i`: staggered up to `maxItems`, the rest appear with the last. */
export function staggerDelay(i: number, step: number = stagger.list, max: number = stagger.maxItems): number {
  return Math.min(i, max - 1) * step;
}

/**
 * Children rise in one after another (35 ms apart, capped at 8). Reduced:
 * a single short fade with no stagger.
 */
export function Stagger({
  children,
  className,
  itemClassName,
  as = "div",
  itemAs = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  as?: ElementType;
  itemAs?: "div" | "li";
  delay?: number;
}) {
  const reduced = useReduced();
  const Container = as;
  const Item = itemAs === "li" ? m.li : m.div;
  return (
    <Container className={className}>
      {Children.toArray(children).map((child, i) => (
        <Item
          key={(child as { key?: string | null }).key ?? i}
          className={itemClassName}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: distance.rise }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={reduced ? transition.reduced : { ...transition.enter, delay: delay + staggerDelay(i) }}
        >
          {child}
        </Item>
      ))}
    </Container>
  );
}
