"use client";

import Link from "next/link";
import { ChevronRight, FileText, History } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { FieldRow } from "@/components/customer/field-row";
import { HowSharingWorks } from "@/components/customer/how-sharing-works";
import { LoadError } from "@/components/customer/load-error";
import { ScreenHeader } from "@/components/customer/screen-header";
import { FadeIn, Skeleton, useToast } from "@/components/motion";
import { CompletionMeter } from "@/components/profile/completion-meter";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/verified-badge";
import { useProfile } from "@/lib/api/use-profile";
import { useSessionExpiry } from "@/lib/auth/use-session-expiry";
import { FIELD_ICONS } from "@/lib/fields-ui";
import { formatPhone } from "@/lib/phone";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="mb-3 text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProfileView() {
  const toast = useToast();
  const profile = useProfile();
  const signedOut = useSessionExpiry(profile.error, "/welcome");

  if (profile.isPending || signedOut) {
    return (
      <main className="pb-8" aria-busy="true">
        <ScreenHeader title="Profile and privacy" backHref="/home" backLabel="Home" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </main>
    );
  }
  if (profile.isError) {
    return (
      <main className="pb-8">
        <ScreenHeader title="Profile and privacy" backHref="/home" backLabel="Home" />
        <div className="mt-6">
          <LoadError what="your profile" onRetry={() => void profile.refetch()} />
        </div>
      </main>
    );
  }

  const view = profile.data;
  const verifiedPhone = view.verified.phone && view.profile.phone ? view.profile.phone : null;
  const verifiedEmail = view.verified.email && view.profile.email ? view.profile.email : null;

  return (
    <main className="pb-10">
      <ScreenHeader
        title="Profile and privacy"
        subtitle="Your details stay with you until you approve a request."
        backHref="/home"
        backLabel="Home"
      />

      <FadeIn>
        <Card className="mt-6 p-4">
          <CompletionMeter completeness={view.completeness} />
        </Card>

        <Section id="details" title="Your details">
          <ProfileForm
            // Re-mount after a save so the form reflects the server's values.
            key={view.updatedAt ?? "new"}
            view={view}
            submitLabel="Save changes"
            onSaved={() => toast.show({ tone: "success", title: "Profile saved", description: "Your changes are saved." })}
          />
        </Section>

        <Section id="verified" title="Verified contacts">
          <Card className="px-4">
            {verifiedPhone || verifiedEmail ? (
              <div className="divide-y">
                {verifiedPhone ? (
                  <FieldRow icon={FIELD_ICONS.MOBILE} label="Mobile number" value={formatPhone(verifiedPhone)} trailing={<VerifiedBadge kind="phone" />} />
                ) : null}
                {verifiedEmail ? (
                  <FieldRow icon={FIELD_ICONS.EMAIL} label="Email address" value={verifiedEmail} trailing={<VerifiedBadge kind="email" />} />
                ) : null}
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No verified contacts yet. A contact is verified when you sign in with it, for example a mobile number
                confirmed by a one-time code. Verification confirms a contact, not your identity.
              </p>
            )}
          </Card>
        </Section>

        <Section id="how" title="How sharing works">
          <Card className="p-4">
            <HowSharingWorks />
          </Card>
        </Section>

        <nav aria-label="More" className="mt-8">
          <Card className="divide-y px-1">
            {[
              { href: "/activity", icon: History, label: "Your activity" },
              { href: "/privacy", icon: FileText, label: "Privacy notice" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex min-h-14 items-center gap-3 px-3 text-sm font-medium hover:bg-surface">
                <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </Card>
        </nav>

        <div className="mt-8">
          <SignOutButton redirectTo="/welcome" className="w-full" />
        </div>
      </FadeIn>
    </main>
  );
}
