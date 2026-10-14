"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronRight, KeyRound, QrCode, ShieldCheck } from "lucide-react";
import { ActivityRow } from "@/components/customer/activity-row";
import { HowSharingWorks } from "@/components/customer/how-sharing-works";
import { LoadError } from "@/components/customer/load-error";
import { Logo } from "@/components/logo";
import { FadeIn, PressScale, Skeleton, Stagger } from "@/components/motion";
import { CompletionMeter } from "@/components/profile/completion-meter";
import { Card } from "@/components/ui/card";
import { useRecentActivity } from "@/lib/api/use-activity";
import { useProfile } from "@/lib/api/use-profile";
import { useSessionExpiry } from "@/lib/auth/use-session-expiry";

const TILES = [
  { href: "/scan", icon: QrCode, title: "Scan QR code", text: "In person at a business" },
  { href: "/code", icon: KeyRound, title: "Enter share code", text: "When a business gives you a code" },
] as const;

/** C05 — home. */
export function HomeView() {
  const router = useRouter();
  const profile = useProfile();
  const activity = useRecentActivity(3);
  const signedOut = useSessionExpiry(profile.error ?? activity.error, "/welcome");

  // New customers set up their profile first (C02 → C04).
  const needsSetup = profile.data !== undefined && !profile.data.saved;
  useEffect(() => {
    if (needsSetup) router.replace("/profile/setup");
  }, [needsSetup, router]);

  const p = profile.data?.profile;
  const initials = [p?.firstName?.[0], p?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] flex-col pb-safe">
      <header className="flex items-center justify-between pt-4">
        <Logo />
        <Link
          href="/profile"
          aria-label="Profile and privacy"
          className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span aria-hidden="true">{initials}</span>
        </Link>
      </header>

      {profile.isPending || signedOut || needsSetup ? (
        <div className="mt-8 space-y-4" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-7 w-40" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : profile.isError ? (
        <div className="mt-8">
          <LoadError what="your profile" onRetry={() => void profile.refetch()} />
        </div>
      ) : (
        <>
          <FadeIn className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight">Hi, {p?.firstName ?? "there"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">What would you like to do?</p>
          </FadeIn>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {TILES.map(({ href, icon: Icon, title, text }) => (
              <PressScale key={href}>
                <Link
                  href={href}
                  className="flex h-full min-h-36 flex-col justify-between rounded-[var(--radius-card)] bg-primary p-4 text-primary-foreground shadow-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-white/10">
                    <Icon className="size-6 text-accent" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-xs text-primary-foreground/80">{text}</span>
                  </span>
                </Link>
              </PressScale>
            ))}
          </div>

          {profile.data.completeness.missing.length > 0 ? (
            <Link href="/profile" className="mt-4 block rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-ring">
              <Card className="flex items-center gap-4 p-4 hover:bg-surface">
                <div className="flex-1">
                  <p className="mb-2 text-sm font-semibold">Finish your profile</p>
                  <CompletionMeter completeness={profile.data.completeness} />
                </div>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </Card>
            </Link>
          ) : null}

          <section className="mt-8" aria-labelledby="recent-heading">
            <div className="flex items-center justify-between">
              <h2 id="recent-heading" className="text-base font-semibold">
                Recent activity
              </h2>
              {activity.data && activity.data.items.length > 0 ? (
                <Link href="/activity" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">
                  View all
                </Link>
              ) : null}
            </div>
            {activity.isPending ? (
              <div className="mt-2 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : activity.isError ? (
              <div className="mt-2">
                <LoadError what="your activity" onRetry={() => void activity.refetch()} />
              </div>
            ) : activity.data.items.length === 0 ? (
              <Card className="mt-3 p-5">
                <p className="mb-4 text-sm font-medium">No sharing yet. Here&apos;s how it works:</p>
                <HowSharingWorks />
              </Card>
            ) : (
              <Stagger as="ul" itemAs="li" className="mt-1 divide-y">
                {activity.data.items.map((item) => (
                  <ActivityRow key={item.grantId} item={item} />
                ))}
              </Stagger>
            )}
          </section>

          <p className="mt-auto flex items-center justify-center gap-2 pt-10 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-accent-strong" aria-hidden="true" />
            Your data. Your choice. Nothing is shared without your approval.
          </p>
        </>
      )}
    </main>
  );
}
