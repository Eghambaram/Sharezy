"use client";

import { m, type HTMLMotionProps } from "motion/react";
import { spring } from "@/lib/motion";
import { useReduced } from "./hooks";

/**
 * Wrap a pressable surface for tactile feedback (scale 0.98). Never delays
 * the click — the gesture is visual only. Reduced: no scale.
 */
export function PressScale(props: Omit<HTMLMotionProps<"div">, "whileTap">) {
  const reduced = useReduced();
  return <m.div whileTap={reduced ? undefined : { scale: 0.98 }} transition={spring.snappy} {...props} />;
}
