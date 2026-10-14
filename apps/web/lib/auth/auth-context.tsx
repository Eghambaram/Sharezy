"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AuthMode } from "@dx/shared";
import { getDevToken, signOutDev } from "./dev-session";

/**
 * The web app's only view of authentication (ADR 0001). Feature code calls
 * `useAuthClient()` and never imports the provider SDK directly.
 */
export interface AuthClient {
  readonly mode: AuthMode;
  /** A short-lived bearer token for the API, or null when signed out. */
  getToken(): Promise<string | null>;
  /** Ends the session and navigates to `redirectTo`. */
  signOut(redirectTo: string): Promise<void>;
}

const AuthClientContext = createContext<AuthClient | null>(null);

export function AuthClientProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
  return <AuthClientContext.Provider value={client}>{children}</AuthClientContext.Provider>;
}

export function useAuthClient(): AuthClient {
  const client = useContext(AuthClientContext);
  if (!client) throw new Error("useAuthClient must be used inside AuthClientProvider");
  return client;
}

export function DevAuthClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo<AuthClient>(
    () => ({
      mode: "dev",
      getToken: () => getDevToken(),
      signOut: async (redirectTo) => {
        await signOutDev();
        window.location.assign(redirectTo);
      },
    }),
    [],
  );
  return <AuthClientProvider client={client}>{children}</AuthClientProvider>;
}
