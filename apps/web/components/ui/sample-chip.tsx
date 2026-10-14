import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Labels synthetic records. Shown wherever `isSample` is true. */
export function SampleChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-strong",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      Sample data
    </span>
  );
}
