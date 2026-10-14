import { defineConfig } from "vitest/config";

/** Integration tests: real Postgres (separate `_test` database), full HTTP stack. */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: "./",
    include: ["test/**/*.int.spec.ts"],
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/env.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
