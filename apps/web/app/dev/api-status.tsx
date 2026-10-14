"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleAlert, RotateCw } from "lucide-react";
import { z } from "zod";
import { AUTH_MODES } from "@dx/shared";
import { Skeleton } from "@/components/motion/skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

const healthSchema = z.object({ status: z.literal("ok"), authMode: z.enum(AUTH_MODES) });
const readySchema = z.object({ status: z.literal("ready") });

/** Live check that the web app can reach the API and the API can reach Postgres. */
export function ApiStatus() {
  const health = useQuery({ queryKey: ["health"], queryFn: ({ signal }) => apiFetch("/health", healthSchema, { signal }) });
  const ready = useQuery({ queryKey: ["ready"], queryFn: ({ signal }) => apiFetch("/ready", readySchema, { signal }) });

  if (health.isPending || ready.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Checking services">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-40" />
      </div>
    );
  }

  const rows = [
    { label: "API", ok: health.isSuccess, detail: health.isSuccess ? `auth mode: ${health.data.authMode}` : "not reachable" },
    { label: "Database", ok: ready.isSuccess, detail: ready.isSuccess ? "connected" : "not reachable" },
  ];

  return (
    <div className="space-y-3" aria-live="polite">
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2 text-sm">
            {r.ok ? (
              <CircleCheck className="size-4 text-accent-strong" aria-hidden="true" />
            ) : (
              <CircleAlert className="size-4 text-destructive" aria-hidden="true" />
            )}
            <span className="font-medium">{r.label}</span>
            <span className="text-muted-foreground">— {r.ok ? "OK" : "Problem"}, {r.detail}</span>
          </li>
        ))}
      </ul>
      {health.isError || ready.isError ? (
        <Button
          variant="outline"
          size="sm"
          icon={<RotateCw className="size-4" aria-hidden="true" />}
          onClick={() => {
            void health.refetch();
            void ready.refetch();
          }}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}
