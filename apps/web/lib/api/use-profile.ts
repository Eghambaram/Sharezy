"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileCompleteness, profileViewSchema, type ProfileRecord, type ProfileView } from "@dx/shared";
import { useAuthedFetch } from "./use-authed-fetch";

export const profileQueryKey = ["me", "profile"] as const;

export function useProfile() {
  const fetchAuthed = useAuthedFetch();
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: ({ signal }) => fetchAuthed("/v1/me/profile", profileViewSchema, { signal }),
  });
}

/**
 * Saves the whole profile record. The cached view updates optimistically and
 * rolls back on error. Callers show success only from `onSuccess` — i.e. after
 * the server confirmed (CLAUDE.md §1.9).
 */
export function useSaveProfile() {
  const fetchAuthed = useAuthedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (record: ProfileRecord) =>
      fetchAuthed("/v1/me/profile", profileViewSchema, { method: "PATCH", body: record }),
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previous = queryClient.getQueryData<ProfileView>(profileQueryKey);
      if (previous) {
        queryClient.setQueryData<ProfileView>(profileQueryKey, {
          ...previous,
          profile: record,
          completeness: profileCompleteness(record),
          // Optimistically keep a badge only if the verified value is unchanged.
          verified: {
            email: previous.verified.email && record.email === previous.profile.email,
            phone: previous.verified.phone && record.phone === previous.profile.phone,
          },
        });
      }
      return { previous };
    },
    onError: (_err, _record, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(profileQueryKey, ctx.previous);
    },
    onSuccess: (view) => {
      queryClient.setQueryData(profileQueryKey, view);
    },
  });
}
