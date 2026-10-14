import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck, Keyboard, SlidersHorizontal } from "lucide-react";
import { ProviderButtons, signUpHref } from "@/components/auth/provider-buttons";
import { PersonWithTabletIllustration } from "@/components/illustrations";
import { LogoMark } from "@/components/logo";
import { FadeIn, Stagger } from "@/components/motion";
import { isSignedIn } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Welcome" };

const BENEFITS = [
  { icon: Keyboard, text: "Less typing" },
  { icon: CircleCheck, text: "Fewer mistakes" },
  { icon: SlidersHorizontal, text: "More control" },
];

/** C01 — customer welcome / sign-in, laid out like the reference board. */
export default async function WelcomePage() {
  if (await isSignedIn()) redirect("/home");

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[480px] flex-col items-center px-4 pt-12 text-center">
      <FadeIn className="flex flex-col items-center">
        <LogoMark className="size-12" />
        <p className="mt-3 text-xl font-semibold tracking-tight text-primary">DataExchange</p>
      </FadeIn>

      <FadeIn delay={0.06} className="mt-6">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight">
          Enter once.
          <br />
          Share anywhere.
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          Your information. Your choice. Enter your details once and share only what you choose, whenever you need.
        </p>
      </FadeIn>

      <Stagger as="ul" itemAs="li" delay={0.12} className="mt-6 flex flex-wrap justify-center gap-2" itemClassName="list-none">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <span key={text} className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-strong">
            <Icon className="size-3.5" aria-hidden="true" />
            {text}
          </span>
        ))}
      </Stagger>

      <FadeIn delay={0.2} className="mt-8 w-full">
        <ProviderButtons audience="customer" />
        <p className="mt-5 text-sm text-muted-foreground">
          New to DataExchange?
          <br />
          <Link href={signUpHref("customer")} className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </FadeIn>

      <div className="mt-auto w-full pb-safe">
        <PersonWithTabletIllustration className="mx-auto h-40 w-auto" />
        <p className="mt-2 text-xs text-muted-foreground">Creating a profile doesn&apos;t verify your real-world identity.</p>
      </div>
    </main>
  );
}
