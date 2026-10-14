"use client";

import { useCallback } from "react";
import type { z } from "zod";
import { useAuthClient } from "@/lib/auth/auth-context";
import { ApiError, apiFetch } from "./client";

type Options = Omit<Parameters<typeof apiFetch>[2], "token">;

/** apiFetch with the current session's bearer token. */
export function useAuthedFetch() {
  const auth = useAuthClient();
  return useCallback(
    async <S extends z.ZodType>(path: string, schema: S, opts: Options = {}): Promise<z.infer<S>> => {
      const token = await auth.getToken();
      if (!token) throw new ApiError("UNAUTHENTICATED", 401, false);
      return apiFetch(path, schema, { ...opts, token });
    },
    [auth],
  );
}
