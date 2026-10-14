import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicEnv } from "@/lib/env";
import { ApiStatus } from "./api-status";

export const metadata: Metadata = { title: "Developer tools" };

/** Development-only index: service status and links to dev tools. */
export default function DevIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const links = [
    { href: "/welcome", label: "Customer welcome (C01)" },
    { href: "/biz/login", label: "Business login (B01)" },
    { href: "/dev/motion", label: "Motion primitives" },
  ];
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <Logo />
      <h1 className="text-xl font-semibold">Developer tools</h1>
      <Card>
        <CardHeader>
          <CardTitle>Service status</CardTitle>
          <CardDescription>Live check against the local API and database.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiStatus />
        </CardContent>
      </Card>
      <nav aria-label="Developer links" className="flex flex-wrap gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={buttonVariants({ variant: "outline" })}>
            {l.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ))}
        <a href={`${publicEnv.NEXT_PUBLIC_API_URL}/docs`} className={buttonVariants({ variant: "outline" })}>
          API docs (Swagger)
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </nav>
    </main>
  );
}
