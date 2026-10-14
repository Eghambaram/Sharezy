"use client";

import { Building2, RotateCw } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/logo";
import { FadeIn, Skeleton, Stagger } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SampleChip } from "@/components/ui/sample-chip";
import { useMe } from "@/lib/api/use-me";
import { useSessionExpiry } from "@/lib/auth/use-session-expiry";

const ROLE_LABEL = { OWNER: "Owner", ADMIN: "Admin", STAFF: "Staff" } as const;

export function DashboardView() {
  const me = useMe();
  const signedOut = useSessionExpiry(me.error, "/biz/login");

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Logo />
        <SignOutButton redirectTo="/biz/login" />
      </header>

      <section className="mt-10" aria-live="polite" aria-busy={me.isPending}>
        {me.isPending || signedOut ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-20 w-full max-w-xl" />
          </div>
        ) : me.isError ? (
          <Card className="max-w-xl p-5">
            <p className="font-medium">We couldn&apos;t load your account</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button
              variant="outline"
              className="mt-4"
              icon={<RotateCw className="size-4" aria-hidden="true" />}
              onClick={() => void me.refetch()}
            >
              Try again
            </Button>
          </Card>
        ) : me.data.memberships.length === 0 ? (
          <FadeIn>
            <Card className="max-w-xl p-6">
              <h1 className="text-xl font-semibold">You&apos;re signed in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                You aren&apos;t part of an organization yet. Creating an organization arrives in the next build phase.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Signing in doesn&apos;t verify a business. Business verification isn&apos;t available yet.
              </p>
            </Card>
          </FadeIn>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Your organizations</h1>
            <p className="mt-1 text-sm text-muted-foreground">Requests and metrics arrive in the next build phase.</p>
            <Stagger as="ul" itemAs="li" className="mt-6 grid max-w-xl gap-3">
              {me.data.memberships.map((m) => (
                <Card key={m.organizationId} className="flex items-center gap-4 p-4">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary-soft">
                    <Building2 className="size-5 text-primary" aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium">{m.organizationName}</span>
                    <span className="text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</span>
                  </span>
                  {m.isSample ? <SampleChip /> : null}
                </Card>
              ))}
            </Stagger>
          </>
        )}
      </section>
    </main>
  );
}
