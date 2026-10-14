import { TriangleAlert } from "lucide-react";
import { isDevAuth } from "@/lib/env";

/**
 * Persistent, non-dismissible banner whenever AUTH_MODE=dev (CLAUDE.md §1.8).
 * Rendered in the root layout so no route can hide it.
 */
export function DevModeBanner() {
  if (!isDevAuth) return null;
  return (
    <div
      role="note"
      aria-label="Development simulation"
      className="sticky top-0 z-[60] flex min-h-8 items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-xs font-semibold text-warning-foreground"
    >
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      <span>Development simulation — not real authentication · synthetic data</span>
    </div>
  );
}
