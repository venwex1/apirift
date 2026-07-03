import { defineConfig, devices } from "@playwright/test";

/**
 * ApiRift E2E configuration.
 *
 * Target selection:
 * - PLAYWRIGHT_BASE_URL set (CI: Vercel preview or production URL) → test
 *   that deployment directly; no local server is started.
 * - Unset (local dev) → starts `npm run dev` automatically.
 *
 * Projects:
 * - setup          signs in the Clerk test user once, saves storage state
 * - unauthenticated public pages, no session
 * - authenticated  dashboard/settings/providers/upgrade, reuses saved session
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isExternalTarget = process.env.PLAYWRIGHT_BASE_URL !== undefined;

// Authenticated tests need a Clerk test account; skip them cleanly when the
// credentials aren't configured instead of failing with a cryptic error.
const hasAuthCreds =
  (process.env.TEST_USER_EMAIL ?? "") !== "" &&
  (process.env.TEST_USER_PASSWORD ?? "") !== "";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: false, // small suite; determinism > speed
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI !== undefined ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI !== undefined
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "unauthenticated",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /auth\.spec\.ts/,
      dependencies: hasAuthCreds ? ["setup"] : [],
      use: {
        ...devices["Desktop Chrome"],
        // Without creds the setup project is skipped and no state file exists;
        // auth.spec.ts then self-skips, so no session is needed either.
        ...(hasAuthCreds ? { storageState: "playwright/.clerk/user.json" } : {}),
      },
    },
  ],
  webServer: isE