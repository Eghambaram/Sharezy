import { Ban, Check, CheckCheck, Clock, Eye, TimerOff, XCircle, type LucideIcon } from "lucide-react";
import { SESSION_STATUS_LABELS, type SessionStatus } from "@dx/shared";
import { cn } from "@/lib/utils";
import { StatusPulse } from "@/components/motion/status-pulse";

const STYLE: Record<SessionStatus, { icon: LucideIcon; className: string }> = {
  WAITING: { icon: Clock, className: "bg-neutral-soft text-neutral" },
  IN_REVIEW: { icon: Eye, className: "bg-info-soft text-info" },
  APPROVED: { icon: Check, className: "bg-accent-soft text-accent-strong" },
  COMPLETED: { icon: CheckCheck, className: "bg-accent-soft text-success-strong" },
  DECLINED: { icon: XCircle, className: "bg-rose-soft text-rose" },
  EXPIRED: { icon: TimerOff, className: "bg-surface-2 text-muted-foreground" },
  CANCELLED: { icon: Ban, className: "bg-surface-2 text-muted-foreground" },
};

/** Status is always icon + text + colour — never colour alone. */
export function StatusPill({ status, className }: { status: SessionStatus; className?: string }) {
  const { icon: Icon, className: tone } = STYLE[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tone, className)}
    >
      {status === "WAITING" ? <StatusPulse tone="neutral" /> : <Icon className="size-3.5" aria-hidden="true" />}
      {SESSION_STATUS_LABELS[status]}
    </span>
  );
}
