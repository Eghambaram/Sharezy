import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

/** The test database: TEST_DATABASE_URL, or DATABASE_URL with `_test` appended to the db name. */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("Set DATABASE_URL or TEST_DATABASE_URL for integration tests");
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/_test$/, "")}_test`;
  return url.toString();
}
