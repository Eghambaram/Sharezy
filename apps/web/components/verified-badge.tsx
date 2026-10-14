import { ShieldCheck } from "lucide-react";

const COPY = {
  phone: "Phone number verified by one-time code",
  email: "Email address verified by your sign-in provider",
} as const;

/**
 * Render ONLY when the API reports the contact as provider-verified
 * (`phoneVerified` / `emailVerified`). Never an identity badge (CLAUDE.md §1.7).
 */
export function VerifiedBadge({ kind }: { kind: keyof typeof COPY }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-strong" title={COPY[kind]}>
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      Verified
      <span className="sr-only">: {COPY[kind]}</span>
    </span>
  );
}
