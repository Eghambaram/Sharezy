"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { LoadError } from "@/components/customer/load-error";
import { ScreenHeader } from "@/components/customer/screen-header";
import { FadeIn, Skeleton, useToast } from "@/components/motion";
import { ProfileForm } from "@/components/profile/profile-form";
import { useProfile } from "@/lib/api/use-profile";
import { useSessionExpiry } from "@/lib/auth/use-session-expiry";

export function ProfileSetupView() {
  const router = useRouter();
  const toast = useToast();
  const profile = useProfile();
  const signedOut = useSessionExpiry(profile.error, "/welcome");

  return (
    <main className="pb-8">
      <ScreenHeader
        title="Set up your profile"
        subtitle="Enter your details once. Each time a business asks, you choose what to share."
      />
      <p className="mt-4 flex items-start gap-2 rounded-[var(--radius-control)] bg-accent-soft p-3 text-sm text-accent-strong">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Only you can see your profile. Businesses receive only the details you approve, for the purpose they state.
      </p>

      <div className="mt-6">
        {profile.isPending || signedOut ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : profile.isError ? (
          <LoadError what="your profile" onRetry={() => void profile.refetch()} />
        ) : (
          <FadeIn>
            <ProfileForm
              view={profile.data}
              submitLabel="Save and continue"
              onSaved={() => {
                toast.show({ tone: "success", title: "Profile saved" });
                router.replace("/home");
              }}
            />
          </FadeIn>
        )}
      </div>
    </main>
  );
}
