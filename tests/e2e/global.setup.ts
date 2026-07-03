import { clerkSetup, clerk } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const STORAGE_STATE = "playwright/.clerk/user.json";

/**
 * One-time authenticated session bootstrap.
 *
 * This file only runs when the "setup" project is included by playwright.config.ts,
 * which happens only when hasAuthCreds is true (sk_test_* key + test credentials).
 * No defensive skip logic needed here — the config gates entry.
 */
setup("authenticate test user", async ({ page }) => {
  await clerkSetup();

  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: email,
      password: password,
    },
  });

  // Verify the session actually works against a protected route.
  await page.goto("/dashboard");
  await page.waitForURL(/\/dashboard/);

  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
