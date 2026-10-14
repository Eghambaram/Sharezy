import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { serverEnv } from "@/lib/server-env";

export const metadata: Metadata = { title: "Sign in" };

/** Clerk sign-in (Google + phone OTP). Not available in dev mode. */
export default function SignInPage() {
  if (serverEnv.NEXT_PUBLIC_AUTH_MODE !== "clerk") notFound();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center gap-6 px-4 py-10">
      <Logo />
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/home" />
    </main>
  );
}
