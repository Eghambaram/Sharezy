"use client";

import { m, type HTMLMotionProps } from "motion/react";
import { distance, transition } from "@/lib/motion";
import { useReduced } from "./hooks";

type FadeInProps = Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> & {
  delay?: number;
};

/** opacity 0→1 with a small rise. Reduced: opacity only, ≤ 150 ms. */
export function FadeIn({ delay = 0, ...props }: FadeInProps) {
  const reduced = useReduced();
  return (
    <m.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: distance.rise }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ ...(reduced ? transition.reduced : transition.enter), delay: reduced ? 0 : delay }}
      {...props}
    />
  );
}
