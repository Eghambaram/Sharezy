import { z } from "zod";
import { AUTH_MODES, QR_TTL_MINUTES } from "@dx/shared";

/** Placeholder secrets shipped in .env.example. Never acceptable in production. */
const DEV_ONLY_MARKER = /dev-only|change-me/i;
const DEV_ONLY_ENC_KEY = "ZGV2LW9ubHkta2V5LWNoYW5nZS1tZS0wMDAwMDAwMDA=";

const origin = z
  .url()
  .transform((u) => new URL(u).origin)
  .describe("Origin without trailing slash");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    APP_ORIGIN: origin,
    API_ORIGIN: origin,
    DATABASE_URL: z.string().min(1),
    AUTH_MODE: z.enum(AUTH_MODES),
    DEV_JWT_SECRET: z.string().optional(),
    CLERK_SECRET_KEY: z.string().optional(),
    CLERK_JWKS_URL: z.string().optional(),
    CLERK_ISSUER: z.string().optional(),
    CLERK_AUDIENCE: z.string().optional(),
    SHARE_CODE_PEPPER: z.string().min(32, "SHARE_CODE_PEPPER must be at least 32 characters"),
    DATA_ENC_KEY: z
      .string()
      .refine((v) => Buffer.from(v, "base64").length === 32, "DATA_ENC_KEY must be 32 bytes, base64-encoded"),
    DATA_ENC_KEY_ID: z.string().min(1),
    QR_TTL_MINUTES: z.coerce.number().int().min(QR_TTL_MINUTES.min).max(QR_TTL_MINUTES.max).default(QR_TTL_MINUTES.default),
    CODE_TTL_MINUTES: z.coerce.number().int().min(1).max(10).default(5),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_MODE === "dev") {
      if (env.NODE_ENV === "production") {
        ctx.addIssue({
          code: "custom",
          path: ["AUTH_MODE"],
          message: "AUTH_MODE=dev is not allowed when NODE_ENV=production. Configure a real auth provider.",
        });
      }
      if (!env.DEV_JWT_SECRET || env.DEV_JWT_SECRET.length < 32) {
        ctx.addIssue({ code: "custom", path: ["DEV_JWT_SECRET"], message: "DEV_JWT_SECRET (≥ 32 chars) is required in dev auth mode" });
      }
    }
    if (env.AUTH_MODE === "clerk") {
      for (const key of ["CLERK_SECRET_KEY", "CLERK_JWKS_URL", "CLERK_ISSUER"] as const) {
        if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: `${key} is required when AUTH_MODE=clerk` });
      }
    }
    if (env.NODE_ENV === "production") {
      if (DEV_ONLY_MARKER.test(env.SHARE_CODE_PEPPER)) {
        ctx.addIssue({ code: "custom", path: ["SHARE_CODE_PEPPER"], message: "Replace the dev-only pepper in production" });
      }
      if (env.DATA_ENC_KEY === DEV_ONLY_ENC_KEY) {
        ctx.addIssue({ code: "custom", path: ["DATA_ENC_KEY"], message: "Replace the dev-only encryption key in production" });
      }
      if (!env.APP_ORIGIN.startsWith("https://") || !env.API_ORIGIN.startsWith("https://")) {
        ctx.addIssue({ code: "custom", path: ["APP_ORIGIN"], message: "Origins must use HTTPS in production" });
      }
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid configuration:\n  - ${issues.join("\n  - ")}`);
    this.name = "ConfigError";
  }
}

/**
 * Validates the environment. Throws ConfigError listing variable names and
 * problems only — never the values themselves.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new ConfigError(result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`));
  }
  return result.data;
}
