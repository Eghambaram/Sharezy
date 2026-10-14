"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { devTokenSchema } from "@dx/shared";
import { serverEnv } from "@/lib/server-env";

/**
 * AUTH_MODE=dev simulated sessions. The dev JWT lives in an httpOnly cookie;
 * the client asks for it via `getDevToken` (same pattern as Clerk's getToken).
 * Server actions carry Next.js's built-in origin check against CSRF.
 */
const COOKIE = "dx_dev_session";

function assertDevMode(): void {
  if (serverEnv.NEXT_PUBLIC_AUTH_MODE !== "dev") throw new Error("Dev sign-in is disabled");
}

export type DevAudience = "customer" | "business";

const DESTINATION: Record<DevAudience, string> = { customer: "/home", business: "/biz/dashboard" };

async function setSession(token: string, expiresAt: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: serverEnv.APP_ORIGIN.startsWith("https://"),
    path: "/",
    expires: new Date(expiresAt),
  });
}

async function postApi(path: string, body: unknown): Promise<{ token: string; expiresAt: string }> {
  const res = await fetch(new URL(path, serverEnv.API_ORIGIN), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Dev sign-in failed (${res.status})`);
  return devTokenSchema.parse(await res.json());
}

export async function signInAsDevUser(userId: string, audience: DevAudience): Promise<never> {
  assertDevMode();
  const { token, expiresAt } = await postApi("/v1/dev-auth/token", { userId });
  await setSession(token, expiresAt);
  redirect(DESTINATION[audience]);
}

export async function signInAsNewDevCustomer(): Promise<never> {
  assertDevMode();
  const { token, expiresAt } = await postApi("/v1/dev-auth/users", { kind: "customer" });
  await setSession(token, expiresAt);
  redirect(DESTINATION.customer);
}

export async function getDevToken(): Promise<string | null> {
  assertDevMode();
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function signOutDev(): Promise<void> {
  assertDevMode();
  (await cookies()).delete(COOKIE);
}

/** For server components: is there a dev session cookie? (Validity is enforced by the API.) */
export async function hasDevSession(): Promise<boolean> {
  if (serverEnv.NEXT_PUBLIC_AUTH_MODE !== "dev") return false;
  return (await cookies()).has(COOKIE);
}
