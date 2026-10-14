import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Board-style row: outline icon, label, value small and muted beneath, trailing slot. */
export function FieldRow({
  icon: Icon,
  label,
  value,
  emptyText = "Not added",
  trailing,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  emptyText?: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-14 items-center gap-3 py-2", className)}>
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className={cn("truncate text-sm", value ? "text-muted-foreground" : "italic text-muted-foreground")}>
          {value ?? emptyText}
        </p>
      </div>
      {trailing}
    </div>
  );
}
