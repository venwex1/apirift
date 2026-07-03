import { test, expect } from "@playwright/test";

/**
 * Checkpoint 2 — unauthenticated surface.
 *
 * One deliberate deviation from the original checkpoint spec: /providers is
 * an authenticated route in ApiRift (it renders per-user watch state), so the
 * unauthenticated assertion here is "redirects to sign-in", and the
 * provider-cards assertion lives in auth.spec.ts. The public provider surface
 * is /p/[slug], covered below.
 */

test.describe("homepage", () => {
  test("loads with ApiRift title, hero, and logo", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ApiRift/i);

    const hero = page.locator("h1").first();
    await expect(hero).toBeVisible();
    await expect(hero).toContainText(/know before it breaks/i);

    // Logo in the header nav shows the brand.
    await expect(
      page.locator("header").getByText(/apirift/i).first()
    ).toBeVisible();

    // Primary CTA exists and points at sign-up.
    await expect(
      page.locator('header a[href*="sign-up"], main a[href*="sign-up"]').first()
    ).toBeVisible();
  });
});

test.describe("pricing", () => {
  test("renders at least 2 plans with prices", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveTitle(/ApiRift/i);

    for (const plan of ["Free", "Pro"]) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`^${plan}$`) })
      ).toBeVisible();
    }
    // At least two distinct dollar amounts on the page.
    const prices = page.getByText(/^\$\d+/);
    expect(await prices.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe("providers (unauthenticated)", () => {
  test("/providers requires auth and redirects to sign-in", async ({ page }) => {
    await page.goto("/providers");
    await page.waitForURL(/sign-in/, { timeout: 20_000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test("/p/stripe public provider page loads with content", async ({ page }) => {
    await page.goto("/p/stripe");
    await expect(
      page.getByRole("heading", { level: 1, name: /stripe/i })
    ).toBeVisible();
    // Stats row renders (changes tracked / breaking counts).
    await expect(page.getByText(/changes tracked/i)).toBeVisible();
  });
});

test.describe("blog", () => {
  test("index lists posts and first post renders with content", async ({ page }) => {
    await page.goto("/blog");
    const postLinks = page.locator('a[href^="/blog/"]');
    expect(await postLinks.count()).toBeGreaterThanOrEqual(1);

    await postLinks.first().click();
    await page.waitForURL(/\/blog\/.+/);
    await expect(page.locator("article h1").first()).toBeVisible();
    // Substantive body content, not an empty shell.
    const body = await page.locator("article").innerText();
    expect(body.length).toBeGreaterThan(500);
  });
});

test.describe("auth pages render Clerk UI", () => {
  for (const path of ["/sign-in", "/sign-up"] as const) {
    test(`${path} renders the Clerk widget`, async ({ page }) => {
      await page.goto(path);
      // Clerk mounts client-side; .cl-rootBox is its stable root class.
      await expect(
        page.locator(".cl-rootBox, .cl-card").first()
      ).toBeVisible({ timeout: 30_000 });
    });
  }
});
