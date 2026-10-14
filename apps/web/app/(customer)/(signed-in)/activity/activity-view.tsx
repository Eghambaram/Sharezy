"use client";

import { ActivityRow } from "@/components/customer/activity-row";
import { HowSharingWorks } from "@/components/customer/how-sharing-works";
import { LoadError } from "@/components/customer/load-error";
import { ScreenHeader } from "@/components/customer/screen-header";
import { Skeleton, Stagger } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useActivityPages } from "@/lib/api/use-activity";
import { useSessionExpiry } from "@/lib/auth/use-session-expiry";

export function ActivityView() {
  const q = useActivityPages();
  const signedOut = useSessionExpiry(q.error, "/welcome");
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <main className="pb-10">
      <ScreenHeader title="Your activity" subtitle="Every request you approved or declined." backHref="/home" backLabel="Home" />
      <div className="mt-6">
        {q.isPending || signedOut ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : q.isError ? (
          <LoadError what="your activity" onRetry={() => void q.refetch()} />
        ) : items.length === 0 ? (
          <Card className="p-5">
            <p className="mb-4 text-sm font-medium">No sharing yet. Here&apos;s how it works:</p>
            <HowSharingWorks />
          </Card>
        ) : (
          <>
            <Stagger as="ul" itemAs="li" className="divide-y">
              {items.map((item) => (
                <ActivityRow key={item.grantId} item={item} />
              ))}
            </Stagger>
            {q.hasNextPage ? (
              <Button variant="outline" block className="mt-4" loading={q.isFetchingNextPage} loadingLabel="Loading more…" onClick={() => void q.fetchNextPage()}>
                Show more
              </Button>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
