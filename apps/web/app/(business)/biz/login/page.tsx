import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProviderButtons, signUpHref } from "@/components/auth/provider-buttons";
import { SkylineIllustration } from "@/components/illustrations";
import { Logo } from "@/components/logo";
import { FadeIn } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { isSignedIn } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Business sign in" };

/** B01 — business portal login card. */
export default async function BusinessLoginPage() {
  if (await isSignedIn()) redirect("/biz/dashboard");

  return (
    <main className="flex min-h-[calc(100dvh-2rem)] items-center justify-center bg-surface px-4 py-10">
      <FadeIn className="w-full max-w-md">
        <Card className="overflow-hidden">
          <div className="flex flex-col items-center px-6 pt-10 text-center sm:px-10">
            <Logo />
            <p className="mt-1 text-sm font-medium text-muted-foreground">Business Portal</p>
            <h1 className="mt-8 text-xl font-semibold">Welcome back!</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your requests</p>
          </div>
          <div className="px-6 pt-6 sm:px-10">
            <ProviderButtons audience="business" />
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              New to DataExchange?{" "}
              <Link href={signUpHref("business")} className="font-medium text-primary underline-offset-4 hover:underline">
                Create a business account
              </Link>
            </p>
          </div>
          <SkylineIllustration className="mt-8 h-24 w-full" />
        </Card>
      </FadeIn>
    </main>
  );
}
