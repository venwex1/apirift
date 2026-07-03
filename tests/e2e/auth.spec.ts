import { test, expect } from "@playwright/test";

/**
 * Checkpoint 2 — authenticated surface. Runs with the storage state produced
 * by global.setup.ts (dedicated Clerk test account).
 *
 * The Stripe checkout redirect test lives here (not in the unauthenticated
 * suite) because /api/stripe/checkout requires a session — an anonymous
 * visitor's upgrade path goes through sign-up first. Stripe is in LIVE mode:
 * the test stops at the checkout.stripe.com redirect and never touches
 * payment details.
 */

const hasCreds =
  (process.env.TEST_USER_EMAIL ?? "") !== "" &&
  (process.env.TEST_USER_PASSWORD ?? "") !== "";

test.skip(!hasCreds, "TEST_USER_EMAIL / TEST_USER_PASSWORD not configured");

test("session lands on /dashboard with key UI elements", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);

  // Page heading ("Signal") and the sidebar nav are the dashboard's spine.
  await expect(
    page.getByRole("heading", { level: 1, name: /signal/i })
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: /primary/i });
  for (const item of ["Signal", "Registry", "Impact", "Alerts", "Settings"]) {
    await expect(nav.getByText(item)).toBeVisible();
  }
});

test("/settings loads without error", async ({ page }) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { level: 1, name: /settings/i })
  ).toBeVisible();
  await expect(page.getByText(/plan/i).first()).toBeVisible();
});

test("/providers loads with at least one provider card", async ({ page }) => {
  await page.goto("/providers");
  await expect(
    page.getByRole("heading", { level: 1, name: /registry/i })
  ).toBeVisible();
  // Every provider card carries a Watch/Watching toggle.
  const watchButtons = page.getByRole("button", { name: /watch/i });
  expect(await watchButtons.count()).toBeGreaterThanOrEqual(1);
});

test("upgrade flow redirects to Stripe Checkout (live mode — no payment)", async ({
  page,
}) => {
  await page.goto("/settings");

  const upgradeButton = page.getByRole("button", { name: /upgrade to pro/i }).first();
  const alreadyPaid = (await upgradeButton.count()) === 0;
  test.skip(
    alreadyPaid,
    "Test account is already on a paid plan — no upgrade button to exercise"
  );

  await upgradeButton.click();

  // Contextual upgrade modal → confirm → Stripe Checkout session redirect.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /upgrade to pro/i }).click();

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  expect(page.url()).toContain("checkout.stripe.com");
  // Full stop: never interact with the live checkout form.
});
