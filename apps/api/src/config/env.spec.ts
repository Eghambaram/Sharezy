import { ConfigError, loadConfig } from "./env.js";

const base = {
  NODE_ENV: "development",
  APP_ORIGIN: "http://localhost:3000",
  API_ORIGIN: "http://localhost:4000",
  DATABASE_URL: "postgresql://x@localhost/db",
  AUTH_MODE: "dev",
  DEV_JWT_SECRET: "dev-only-jwt-secret-change-me-0000000000000000",
  SHARE_CODE_PEPPER: "dev-only-pepper-change-me-000000000000000000000000",
  DATA_ENC_KEY: "ZGV2LW9ubHkta2V5LWNoYW5nZS1tZS0wMDAwMDAwMDA=",
  DATA_ENC_KEY_ID: "dev-1",
} satisfies NodeJS.ProcessEnv;

const prodSecrets = {
  NODE_ENV: "production",
  APP_ORIGIN: "https://app.example.com",
  API_ORIGIN: "https://api.example.com",
  SHARE_CODE_PEPPER: "x".repeat(48),
  DATA_ENC_KEY: Buffer.alloc(32, 7).toString("base64"),
};

function issues(env: NodeJS.ProcessEnv): string[] {
  try {
    loadConfig(env);
    return [];
  } catch (e) {
    if (e instanceof ConfigError) return [...e.issues];
    throw e;
  }
}

describe("loadConfig", () => {
  it("accepts the .env.example dev defaults", () => {
    const cfg = loadConfig(base);
    expect(cfg.AUTH_MODE).toBe("dev");
    expect(cfg.API_PORT).toBe(4000);
    expect(cfg.QR_TTL_MINUTES).toBe(15);
  });

  it("refuses AUTH_MODE=dev in production", () => {
    expect(issues({ ...base, ...prodSecrets })).toEqual(
      expect.arrayContaining([expect.stringMatching(/^AUTH_MODE: AUTH_MODE=dev is not allowed/)]),
    );
  });

  it("refuses dev-only secrets in production", () => {
    const found = issues({
      ...base,
      NODE_ENV: "production",
      AUTH_MODE: "clerk",
      CLERK_SECRET_KEY: "sk",
      CLERK_JWKS_URL: "https://x/jwks",
      CLERK_ISSUER: "https://x",
      APP_ORIGIN: "https://app.example.com",
      API_ORIGIN: "https://api.example.com",
    });
    expect(found.some((i) => i.startsWith("SHARE_CODE_PEPPER"))).toBe(true);
    expect(found.some((i) => i.startsWith("DATA_ENC_KEY"))).toBe(true);
  });

  it("requires Clerk settings when AUTH_MODE=clerk", () => {
    const found = issues({ ...base, AUTH_MODE: "clerk" });
    expect(found).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^CLERK_SECRET_KEY/),
        expect.stringMatching(/^CLERK_JWKS_URL/),
        expect.stringMatching(/^CLERK_ISSUER/),
      ]),
    );
  });

  it("rejects an encryption key that isn't 32 bytes", () => {
    expect(issues({ ...base, DATA_ENC_KEY: Buffer.alloc(16).toString("base64") })).toEqual([
      expect.stringMatching(/^DATA_ENC_KEY/),
    ]);
  });

  it("never includes secret values in error messages", () => {
    const secret = "short-secret";
    const found = issues({ ...base, SHARE_CODE_PEPPER: secret });
    expect(found.join("\n")).not.toContain(secret);
  });
});
