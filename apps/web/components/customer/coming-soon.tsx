import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ScreenHeader } from "./screen-header";

/** Honest placeholder for a screen scheduled in a later build phase. Always offers a way home. */
export function ComingSoon({ title, icon: Icon, text }: { title: string; icon: LucideIcon; text: string }) {
  return (
    <main className="flex min-h-[calc(100dvh-2rem)] flex-col pb-safe">
      <ScreenHeader title={title} backHref="/home" backLabel="Home" />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary-soft">
          <Icon className="size-8 text-primary" aria-hidden="true" />
        </span>
        <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
      </div>
      <Link href="/home" className={buttonVariants({ variant: "primary", size: "lg", block: true })}>
        Back to home
      </Link>
    </main>
  );
}
