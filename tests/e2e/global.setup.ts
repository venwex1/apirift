import { clerkSetup, clerk } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const STORAGE_STATE = "playwright/.clerk/user.json";

/**
 * One-time authenticated session bootstrap.
 * clerkSetup() obtains a Testing Token (requires CLERK_SECRET_KEY +
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in env) so Clerk's bot detection doesn't
 * block the scripted sign-in; clerk.signIn() then authenticates the dedicated
 * test user and we persist the session for the `authenticated` project.
 */
setup("authenticate test user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  setup.skip(
    email === undefined || email === "" || password === undefined || password === "",
    "TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping authenticated suite"
  );

  // clerkSetup() fetches a Testing Token which is only supported with
  // Clerk development-mode keys (sk_test_*). Live keys (sk_live_*) cause
  // the request to hang indefinitely — skip before calling the API.
  const clerkKey = process.env.CLERK_SECRET_KEY ?? "";
  if (!clerkKey.startsWith("sk_test_")) {
    console.warn("[setup] CLERK_SECRET_KEY is not a test key — skipping authenticated suite (testing tokens require sk_test_*)");
    setup.skip(true, "Clerk Testing Token requires sk_test_* key — skipping authenticated suite");
  }

  await clerkSetup();

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: email as string,
      password: password as string,
    },
  });

  // Verify the session actually works against a protected route.
  await page.goto("/dashboard");
  await page.waitForURL(/\/dashboard/);

  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
