import { SignJWT, errors as joseErrors, jwtVerify } from "jose";
import { InvalidTokenError, type AuthProvider, type ProviderContacts, type VerifiedIdentity } from "./auth-provider.js";

export const DEV_TOKEN_ISSUER = "dx-dev-auth";
export const DEV_TOKEN_AUDIENCE = "dx-api";
export const DEV_TOKEN_TTL_SECONDS = 4 * 60 * 60;

/**
 * AUTH_MODE=dev only. Accepts HS256 tokens issued by the dev-auth endpoint for
 * synthetic users. Never active in production (config refuses to boot).
 */
export class DevAuthProvider implements AuthProvider {
  readonly mode = "dev" as const;
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  async issue(subject: string, ttlSeconds = DEV_TOKEN_TTL_SECONDS): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(subject)
      .setIssuer(DEV_TOKEN_ISSUER)
      .setAudience(DEV_TOKEN_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.key);
    return { token, expiresAt };
  }

  async verify(token: string): Promise<VerifiedIdentity> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ["HS256"],
        issuer: DEV_TOKEN_ISSUER,
        audience: DEV_TOKEN_AUDIENCE,
        requiredClaims: ["sub", "exp", "iat"],
      });
      if (!payload.sub) throw new InvalidTokenError("missing subject");
      return { subject: payload.sub };
    } catch (e) {
      throw toInvalidToken(e);
    }
  }

  /** Synthetic users have no provider-verified contacts. */
  async fetchContacts(): Promise<ProviderContacts | null> {
    return null;
  }
}

export function toInvalidToken(e: unknown): InvalidTokenError {
  if (e instanceof InvalidTokenError) return e;
  if (e instanceof joseErrors.JWTExpired) return new InvalidTokenError("expired");
  if (e instanceof joseErrors.JOSEError) return new InvalidTokenError(e.code);
  return new InvalidTokenError("unverifiable");
}
