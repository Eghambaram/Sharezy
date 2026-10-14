"use client";

import { useQuery } from "@tanstack/react-query";
import { meSchema } from "@dx/shared";
import { useAuthClient } from "@/lib/auth/auth-context";
import { ApiError, apiFetch } from "./client";

export const meQueryKey = ["me"] as const;

/** The signed-in user. Errors with code UNAUTHENTICATED when the session is gone. */
export function useMe() {
  const auth = useAuthClient();
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async ({ signal }) => {
      const token = await auth.getToken();
      if (!token) throw new ApiError("UNAUTHENTICATED", 401, false);
      return apiFetch("/v1/me", meSchema, { token, signal });
    },
  });
}
