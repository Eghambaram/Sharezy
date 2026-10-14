import { Building2, CircleCheck, CircleX } from "lucide-react";
import type { ActivityItem } from "@dx/shared";
import { SampleChip } from "@/components/ui/sample-chip";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** One consent decision: org, purpose, when, decision (icon + text), shared vs requested. */
export function ActivityRow({ item }: { item: ActivityItem }) {
  const approved = item.decision === "APPROVED";
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
        <Building2 className="size-5 text-primary" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{item.organizationName}</p>
          {item.isSample ? <SampleChip /> : null}
        </div>
        <p className="truncate text-sm text-muted-foreground">{item.purpose}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <time dateTime={item.decidedAt}>{dateFormat.format(new Date(item.decidedAt))}</time>
          {" · "}
          {approved
            ? `Shared ${item.sharedKeys.length} of ${item.requestedKeys.length} requested`
            : `Nothing shared (${item.requestedKeys.length} requested)`}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
          approved ? "bg-accent-soft text-accent-strong" : "bg-neutral-soft text-neutral",
        )}
      >
        {approved ? <CircleCheck className="size-3.5" aria-hidden="true" /> : <CircleX className="size-3.5" aria-hidden="true" />}
        {approved ? "Shared" : "Declined"}
      </span>
    </div>
  );
}
