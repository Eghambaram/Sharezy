"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ToastProvider } from "@/components/motion/toast";
import { ApiError } from "@/lib/api/client";
import { DevAuthClientProvider } from "@/lib/auth/auth-context";
import { ClerkAuthClientProvider } from "@/lib/auth/clerk-client";
import { isDevAuth } from "@/lib/env";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            // Personal data must not linger in memory longer than needed.
            gcTime: 5 * 60_000,
            retry: (count, err) => count < 2 && (!(err instanceof ApiError) || err.retryable),
            refetchOnWindowFocus: true,
          },
        },
      }),
  );
  const AuthProvider = isDevAuth ? DevAuthClientProvider : ClerkAuthClientProvider;
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
