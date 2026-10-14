"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/** Full-width row button for the dev user list; disables while signing in. */
export function DevSignInButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-control)] border bg-card px-4 py-3 text-left text-sm transition-colors",
        "hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
      )}
    >
      {children}
      {pending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-label="Signing in" /> : null}
    </button>
  );
}
