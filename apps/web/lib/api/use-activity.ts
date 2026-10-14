"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { activityPageSchema } from "@dx/shared";
import { useAuthedFetch } from "./use-authed-fetch";

export function useRecentActivity(limit = 3) {
  const fetchAuthed = useAuthedFetch();
  return useQuery({
    queryKey: ["me", "activity", "recent", limit],
    queryFn: ({ signal }) => fetchAuthed(`/v1/me/activity?limit=${limit}`, activityPageSchema, { signal }),
  });
}

export function useActivityPages() {
  const fetchAuthed = useAuthedFetch();
  return useInfiniteQuery({
    queryKey: ["me", "activity", "all"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      fetchAuthed(
        `/v1/me/activity?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        activityPageSchema,
        { signal },
      ),
    getNextPageParam: (last) => last.nextCursor,
  });
}
