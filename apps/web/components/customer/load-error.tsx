"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Error state with retry for customer screens. */
export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <Card className="p-5" role="alert">
      <p className="font-medium">We couldn&apos;t load {what}</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
      <Button variant="outline" className="mt-4" icon={<RotateCw className="size-4" aria-hidden="true" />} onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
