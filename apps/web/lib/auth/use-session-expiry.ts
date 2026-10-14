"use client";

import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/api/client";
import { useAuthClient } from "./auth-context";

/**
 * When the API rejects the session (expired, revoked, deleted account), end it
 * properly — clearing the cookie or provider session — before going to
 * sign-in. Redirecting without signing out would loop, because the sign-in
 * page sees the stale session and sends the user straight back.
 */
export function useSessionExpiry(error: unknown, signInPath: "/welcome" | "/biz/login"): boolean {
  const auth = useAuthClient();
  const expired = error instanceof ApiError && error.code === "UNAUTHENTICATED";
  const started = useRef(false);

  useEffect(() => {
    if (!expired || started.current) return;
    started.current = true;
    void auth.signOut(signInPath);
  }, [expired, auth, signInPath]);

  return expired;
}
