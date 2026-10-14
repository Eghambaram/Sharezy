import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Local dev reads the repo-root .env; deployed environments inject variables directly.
loadEnv({ path: "../../.env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (postinstall, CI) needs no database, so DATABASE_URL may be
    // absent there. migrate/seed fail with a clear connection error if it's missing.
    url: process.env.DATABASE_URL ?? "",
  },
});
