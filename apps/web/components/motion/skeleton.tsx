import { cn } from "@/lib/utils";

/** Shimmer placeholder (CSS, transform-only). Static in reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("dx-skeleton block rounded-[var(--radius-control)]", className)} />;
}
