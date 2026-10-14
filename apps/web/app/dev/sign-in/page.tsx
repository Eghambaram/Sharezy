import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FlaskConical, UserPlus, UserRound } from "lucide-react";
import { devUsersSchema, type DevUser } from "@dx/shared";
import { SampleChip } from "@/components/ui/sample-chip";
import { Card } from "@/components/ui/card";
import { serverEnv } from "@/lib/server-env";
import { signInAsDevUser, signInAsNewDevCustomer } from "@/lib/auth/dev-session";
import { DevSignInButton } from "./sign-in-button";

export const metadata: Metadata = { title: "Development sign-in" };
export const dynamic = "force-dynamic";

async function loadUsers(): Promise<DevUser[] | null> {
  try {
    const res = await fetch(new URL("/v1/dev-auth/users", serverEnv.API_ORIGIN), { cache: "no-store" });
    if (!res.ok) return null;
    return devUsersSchema.parse(await res.json());
  } catch {
    return null;
  }
}

/** AUTH_MODE=dev only: pick a synthetic user. No real authentication happens. */
export default async function DevSignInPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  if (serverEnv.NEXT_PUBLIC_AUTH_MODE !== "dev") notFound();
  const { as } = await searchParams;
  const audience = as === "business" ? "business" : "customer";
  const users = await loadUsers();
  const back = audience === "business" ? "/biz/login" : "/welcome";

  const business = users?.filter((u) => u.kind === "business") ?? [];
  const customers = users?.filter((u) => u.kind === "customer") ?? [];
  const sections =
    audience === "business"
      ? [{ id: "business", title: "Business users", users: business }, { id: "customers", title: "Customers", users: customers }]
      : [{ id: "customers", title: "Customers", users: customers }, { id: "business", title: "Business users", users: business }];

  return (
    <main className="mx-auto w-full max-w-[480px] px-4 py-8">
      <Link href={back} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Link>

      <div className="mt-4 rounded-[var(--radius-card)] border border-warning bg-warning-soft p-4">
        <p className="flex items-center gap-2 font-semibold text-warning-strong">
          <FlaskConical className="size-4" aria-hidden="true" /> Development simulation
        </p>
        <p className="mt-1 text-sm text-warning-strong">
          This is not real authentication. Choose a synthetic user to continue. No Google account or one-time code is
          involved.
        </p>
      </div>

      {users === null ? (
        <Card className="mt-6 p-5">
          <p className="font-medium">Can&apos;t reach the API</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start it with <code className="font-mono">pnpm dev</code>, then try again.
          </p>
          <Link href={`/dev/sign-in?as=${audience}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary">
            Try again
          </Link>
        </Card>
      ) : (
        <>
          {sections.map((s) => (
            <section key={s.id} className="mt-6" aria-labelledby={`h-${s.id}`}>
              <h2 id={`h-${s.id}`} className="mb-2 text-sm font-semibold text-muted-foreground">
                {s.title}
              </h2>
              {s.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet. Run <code className="font-mono">pnpm -F api db:seed</code>.</p>
              ) : (
                <ul className="grid gap-2">
                  {s.users.map((u) => (
                    <li key={u.id}>
                      <form action={signInAsDevUser.bind(null, u.id, u.kind)}>
                        <DevSignInButton>
                          {u.kind === "business" ? (
                            <Building2 className="size-5 text-primary" aria-hidden="true" />
                          ) : (
                            <UserRound className="size-5 text-primary" aria-hidden="true" />
                          )}
                          <span className="flex flex-1 flex-col items-start">
                            <span className="font-medium">{u.displayName}</span>
                            {u.organizationName ? (
                              <span className="text-xs text-muted-foreground">{u.organizationName}</span>
                            ) : null}
                          </span>
                          <SampleChip />
                        </DevSignInButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <section className="mt-6">
            <form action={signInAsNewDevCustomer}>
              <DevSignInButton>
                <UserPlus className="size-5 text-primary" aria-hidden="true" />
                <span className="flex flex-1 flex-col items-start">
                  <span className="font-medium">Start as a new customer</span>
                  <span className="text-xs text-muted-foreground">Creates an empty synthetic account</span>
                </span>
              </DevSignInButton>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
