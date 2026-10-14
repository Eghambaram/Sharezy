import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type JWK } from "jose";
import { InvalidTokenError } from "./auth-provider.js";
import { ClerkAuthProvider } from "./clerk-auth-provider.js";
import { DEV_TOKEN_AUDIENCE, DEV_TOKEN_ISSUER, DevAuthProvider } from "./dev-auth-provider.js";

const SECRET = "dev-only-jwt-secret-change-me-0000000000000000";

async function rejects(p: Promise<unknown>, reason?: string): Promise<void> {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(InvalidTokenError);
  if (reason) expect((err as InvalidTokenError).reason).toBe(reason);
}

describe("DevAuthProvider", () => {
  const provider = new DevAuthProvider(SECRET);

  it("verifies tokens it issued", async () => {
    const { token } = await provider.issue("dev-alex-morgan");
    await expect(provider.verify(token)).resolves.toEqual({ subject: "dev-alex-morgan" });
  });

  it("rejects a token signed with another secret", async () => {
    const { token } = await new DevAuthProvider("x".repeat(48)).issue("dev-alex-morgan");
    await rejects(provider.verify(token));
  });

  it("rejects expired tokens", async () => {
    const { token } = await provider.issue("dev-alex-morgan", -10);
    await rejects(provider.verify(token), "expired");
  });

  it("rejects the wrong audience or issuer", async () => {
    const key = new TextEncoder().encode(SECRET);
    const base = () => new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject("dev-x").setIssuedAt().setExpirationTime("1h");
    await rejects(provider.verify(await base().setIssuer(DEV_TOKEN_ISSUER).setAudience("other").sign(key)));
    await rejects(provider.verify(await base().setIssuer("other").setAudience(DEV_TOKEN_AUDIENCE).sign(key)));
  });

  it("rejects unsigned (alg: none) tokens", async () => {
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const token = `${enc({ alg: "none" })}.${enc({ sub: "dev-x", iss: DEV_TOKEN_ISSUER, aud: DEV_TOKEN_AUDIENCE, iat: now, exp: now + 60 })}.`;
    await rejects(provider.verify(token));
  });

  it("never reports provider-verified contacts", async () => {
    await expect(provider.fetchContacts()).resolves.toBeNull();
  });
});

describe("ClerkAuthProvider", () => {
  const ISSUER = "https://clerk.example.test";
  const ORIGIN = "https://app.example.test";
  let privateKey: CryptoKey;
  let jwk: JWK;

  beforeAll(async () => {
    const pair = await generateKeyPair("RS256");
    privateKey = pair.privateKey;
    jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256" };
  });

  const make = (fetchImpl?: typeof fetch) =>
    new ClerkAuthProvider({
      issuer: ISSUER,
      authorizedParties: [ORIGIN],
      secretKey: "sk_test_x",
      jwks: createLocalJWKSet({ keys: [jwk] }),
      apiUrl: "https://api.clerk.example.test",
      ...(fetchImpl ? { fetchImpl } : {}),
    });

  const sign = (claims: Record<string, unknown> = {}, iss = ISSUER, exp: string | number = "5m") =>
    new SignJWT({ azp: ORIGIN, ...claims })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setSubject("user_123")
      .setIssuer(iss)
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(privateKey);

  it("accepts a valid session token", async () => {
    await expect(make().verify(await sign())).resolves.toEqual({ subject: "user_123" });
  });

  it("rejects a foreign authorized party (azp)", async () => {
    await rejects(make().verify(await sign({ azp: "https://evil.test" })), "unauthorized party");
  });

  it("rejects pending sessions", async () => {
    await rejects(make().verify(await sign({ sts: "pending" })), "session pending");
  });

  it("rejects the wrong issuer and expired tokens", async () => {
    await rejects(make().verify(await sign({}, "https://other.test")));
    await rejects(make().verify(await sign({}, ISSUER, Math.floor(Date.now() / 1000) - 60)), "expired");
  });

  it("maps verified primary contacts from the Backend API", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        primary_email_address_id: "e1",
        primary_phone_number_id: "p1",
        email_addresses: [
          { id: "e0", email_address: "old@example.com", verification: { status: "verified" } },
          { id: "e1", email_address: "Alex@Example.com", verification: { status: "unverified" } },
        ],
        phone_numbers: [{ id: "p1", phone_number: "+919876543210", verification: { status: "verified" } }],
      }),
    );
    const contacts = await make(fetchImpl as unknown as typeof fetch).fetchContacts("user_123");
    expect(contacts).toEqual({ email: "alex@example.com", emailVerified: false, phone: "+919876543210", phoneVerified: true });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.clerk.example.test/v1/users/user_123", expect.anything());
  });

  it("returns null (keep existing) when the Backend API fails", async () => {
    const failing = vi.fn(async () => new Response("nope", { status: 503 }));
    await expect(make(failing as unknown as typeof fetch).fetchContacts("user_123")).resolves.toBeNull();
    const throwing = vi.fn(async () => {
      throw new Error("network");
    });
    await expect(make(throwing as unknown as typeof fetch).fetchContacts("user_123")).resolves.toBeNull();
  });
});
