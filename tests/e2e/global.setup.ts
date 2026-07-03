import { clerkSetup, clerk } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const STORAGE_STATE = "playwright/.clerk/user.json";

/**
 * One-time authenticated session bootstrap.
 *
 * playwright.config.ts already excludes this project when hasAuthCreds is
 * false (live Clerk key or missing credentials). This guard is a second line
 * of defence in case the config-level check is bypassed for any reason.
 */
setup("authenticate test user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL ?? "";
  const password = process.env.TEST_USER_PASSWORD ?? "";
  const clerkKey = process.env.CLERK_SECRET_KEY ?? "";

  if (!email || !password || !clerkKey.startsWith("sk_test_")) {
    console.warn(
      "[setup] Auth setup skipped — requires TEST_USER_EMAIL, TEST_USER_PASSWORD, " +
        "and a Clerk development key (sk_test_*). " +
        "Current key type: " + (clerkKey ? clerkKey.slice(0, 10) + "…" : "missing")
    );
    // Write an empty storage state so the authenticated project doesn't error
    // when it tries to load the file. auth.spec.ts self-skips without a session.
    mkdirSync(dirname(STORAGE_STATE), { recursive: true });
    writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    return; // Exit before clerkSetup() which hangs on live keys
  }

  await clerkSetup();

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
