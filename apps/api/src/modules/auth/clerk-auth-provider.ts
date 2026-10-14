import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { z } from "zod";
import { InvalidTokenError, type AuthProvider, type ProviderContacts, type VerifiedIdentity } from "./auth-provider.js";
import { toInvalidToken } from "./dev-auth-provider.js";

export interface ClerkOptions {
  readonly issuer: string;
  readonly audience?: string;
  /** Origins allowed in the `azp` claim (the web app). */
  readonly authorizedParties: readonly string[];
  readonly secretKey: string;
  readonly jwks: JWTVerifyGetKey;
  readonly apiUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

const verificationSchema = z.object({ status: z.string() }).nullable().optional();

/** Subset of the Clerk Backend API user object we rely on (snake_case JSON). */
const clerkUserSchema = z.object({
  primary_email_address_id: z.string().nullable().optional(),
  primary_phone_number_id: z.string().nullable().optional(),
  email_addresses: z.array(z.object({ id: z.string(), email_address: z.string(), verification: verificationSchema })).default([]),
  phone_numbers: z.array(z.object({ id: z.string(), phone_number: z.string(), verification: verificationSchema })).default([]),
});

export function createClerkJwks(jwksUrl: string): JWTVerifyGetKey {
  return createRemoteJWKSet(new URL(jwksUrl), { cooldownDuration: 30_000, cacheMaxAge: 10 * 60_000 });
}

/**
 * Verifies Clerk session tokens via JWKS (RS256): signature, issuer, expiry,
 * not-before, optional audience, and `azp` against our web origin (CSRF guard
 * recommended by Clerk). Contacts come from the Backend API, so verification
 * status is authoritative rather than a client-supplied claim.
 */
export class ClerkAuthProvider implements AuthProvider {
  readonly mode = "clerk" as const;
  private readonly apiUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: ClerkOptions) {
    this.apiUrl = opts.apiUrl ?? "https://api.clerk.com";
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async verify(token: string): Promise<VerifiedIdentity> {
    try {
      const { payload } = await jwtVerify(token, this.opts.jwks, {
        algorithms: ["RS256"],
        issuer: this.opts.issuer,
        ...(this.opts.audience ? { audience: this.opts.audience } : {}),
        requiredClaims: ["sub", "exp", "iat"],
        clockTolerance: 5,
      });
      if (!payload.sub) throw new InvalidTokenError("missing subject");
      const azp = payload["azp"];
      if (azp !== undefined && (typeof azp !== "string" || !this.opts.authorizedParties.includes(azp))) {
        throw new InvalidTokenError("unauthorized party");
      }
      if (payload["sts"] === "pending") throw new InvalidTokenError("session pending");
      return { subject: payload.sub };
    } catch (e) {
      throw toInvalidToken(e);
    }
  }

  async fetchContacts(subject: string): Promise<ProviderContacts | null> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.apiUrl}/v1/users/${encodeURIComponent(subject)}`, {
        headers: { Authorization: `Bearer ${this.opts.secretKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      return null;
    }
    if (!res.ok) return null;
    const parsed = clerkUserSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return null;
    const u = parsed.data;

    const email = u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? null;
    const phone = u.phone_numbers.find((p) => p.id === u.primary_phone_number_id) ?? null;
    return {
      email: email?.email_address.toLowerCase() ?? null,
      emailVerified: email?.verification?.status === "verified",
      phone: phone?.phone_number ?? null,
      phoneVerified: phone?.verification?.status === "verified",
    };
  }
}
