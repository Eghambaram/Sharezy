import type { AuthMode } from "@dx/shared";

/** The identity proven by a verified access token. */
export interface VerifiedIdentity {
  readonly subject: string;
}

/**
 * Contact details as the provider knows them. `*Verified` is true only when
 * the provider actually verified the value (OTP, OAuth email). This is the
 * only source for verified badges (CLAUDE.md §1.7).
 */
export interface ProviderContacts {
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly phone: string | null;
  readonly phoneVerified: boolean;
}

/**
 * Boundary around the identity provider (ADR 0001). Swapping Clerk for Auth0
 * means writing one new implementation of this interface.
 */
export interface AuthProvider {
  readonly mode: AuthMode;
  /** Verifies signature, issuer, audience, expiry. Throws InvalidTokenError. */
  verify(token: string): Promise<VerifiedIdentity>;
  /** Current contact details, or null if unavailable (keep what we have). */
  fetchContacts(subject: string): Promise<ProviderContacts | null>;
}

export const AUTH_PROVIDER = Symbol("AUTH_PROVIDER");

export class InvalidTokenError extends Error {
  constructor(readonly reason: string) {
    super(`Invalid token: ${reason}`);
    this.name = "InvalidTokenError";
  }
}
