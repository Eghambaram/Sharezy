import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/server-env";
import { hasDevSession } from "./dev-session";

/** Whether the request carries a session. The API still verifies every call. */
export async function isSignedIn(): Promise<boolean> {
  if (serverEnv.NEXT_PUBLIC_AUTH_MODE === "dev") return hasDevSession();
  const { userId } = await auth();
  return userId !== null;
}

/** Gate for protected layouts: redirects to `signInPath` without a session. */
export async function requireSession(signInPath: "/welcome" | "/biz/login"): Promise<void> {
  if (!(await isSignedIn())) redirect(signInPath);
}
