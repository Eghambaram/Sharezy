"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useMemo, type ReactNode } from "react";
import { AuthClientProvider, type AuthClient } from "./auth-context";

/** Adapts Clerk's hooks to our AuthClient. Must render inside <ClerkProvider>. */
export function ClerkAuthClientProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const clerk = useClerk();
  const client = useMemo<AuthClient>(
    () => ({
      mode: "clerk",
      getToken: () => getToken(),
      signOut: (redirectTo) => clerk.signOut({ redirectUrl: redirectTo }),
    }),
    [getToken, clerk],
  );
  return <AuthClientProvider client={client}>{children}</AuthClientProvider>;
}
