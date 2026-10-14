import "server-only";
import { z } from "zod";
import { AUTH_MODES } from "@dx/shared";

/** Server-only configuration (never bundled for the browser). */
const serverEnvSchema = z.object({
  API_ORIGIN: z.url().default("http://localhost:4000"),
  APP_ORIGIN: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_AUTH_MODE: z.enum(AUTH_MODES).default("dev"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const serverEnv = serverEnvSchema.parse({
  API_ORIGIN: process.env.API_ORIGIN,
  APP_ORIGIN: process.env.APP_ORIGIN,
  NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE,
  NODE_ENV: process.env.NODE_ENV,
});
