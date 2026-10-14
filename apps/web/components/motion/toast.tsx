"use client";

import { AnimatePresence, m } from "motion/react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReduced } from "./hooks";

export type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  /** Show a toast. Use "success" ONLY after a confirmed 2xx (CLAUDE.md §1.9). */
  show: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const AUTO_DISMISS_MS = 4000;

const TONE = {
  success: { icon: CircleCheck, className: "text-accent-strong" },
  error: { icon: CircleAlert, className: "text-destructive" },
  info: { icon: Info, className: "text-info" },
} as const;

/**
 * Toasts slide 16 px and fade (PROMPT.md §12.4), auto-dismiss after 4 s, and
 * pause while hovered or focused. Announced politely; errors assertively.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);
  const api = useMemo<ToastApi>(
    () => ({
      show: (t) => setItems((all) => [...all.slice(-2), { ...t, id: nextId.current++ }]),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-safe sm:inset-x-auto sm:right-4 sm:items-end"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const reduced = useReduced();
  const [paused, setPaused] = useState(false);
  const { icon: Icon, className } = TONE[item.tone];

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [paused, item.id, onDismiss]);

  return (
    <m.div
      role={item.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-card)] border bg-card p-4 text-card-foreground shadow-2"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, transition: transition.exit }}
      transition={reduced ? transition.reduced : transition.enter}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", className)} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="-m-2 inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </m.div>
  );
}
