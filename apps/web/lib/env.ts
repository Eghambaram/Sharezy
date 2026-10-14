import { z } from "zod";
import { AUTH_MODES } from "@dx/shared";

/**
 * Browser-visible configuration. Each NEXT_PUBLIC_* variable must be referenced
 * literally so Next.js can inline it at build time.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:4000"),
  NEXT_PUBLIC_AUTH_MODE: z.enum(AUTH_MODES).default("dev"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE,
});

export const isDevAuth = publicEnv.NEXT_PUBLIC_AUTH_MODE === "dev";
