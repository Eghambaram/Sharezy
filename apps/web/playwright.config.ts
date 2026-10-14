import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the real API in AUTH_MODE=dev with seeded synthetic data.
 * Reduced motion keeps runs deterministic (PROMPT.md §12.5).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /customer\..*spec\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }, testMatch: /business\..*spec\.ts/ },
  ],
  webServer: {
    command: "pnpm --dir ../.. dev",
    url: "http://localhost:3000/welcome",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
