"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthClient } from "@/lib/auth/auth-context";

export function SignOutButton({ redirectTo, className }: { redirectTo: string; className?: string }) {
  const auth = useAuthClient();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      className={className}
      loading={pending}
      loadingLabel="Signing out…"
      icon={<LogOut className="size-4" aria-hidden="true" />}
      onClick={async () => {
        setPending(true);
        // Drop any personal data held in memory before leaving.
        queryClient.clear();
        try {
          await auth.signOut(redirectTo);
        } catch {
          setPending(false);
        }
      }}
    >
      Sign out
    </Button>
  );
}
