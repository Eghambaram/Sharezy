import { cn } from "@/lib/utils";

/** Original DataExchange mark: two exchange arrows inside a rounded square. Decorative. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M9 12h11l-3-3M23 20H12l3 3" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
    </svg>
  );
}

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <LogoMark />
      {withWordmark ? <span className="text-lg font-semibold tracking-tight">DataExchange</span> : <span className="sr-only">DataExchange</span>}
    </span>
  );
}
