/**
 * Creates the UPSTREAM-BETA coupon + customer-facing promotion code.
 *
 *   Coupon:    UPSTREAM-BETA — 100% off, repeating 3 months, max 20 redemptions
 *   Promo code: UPSTREAM-BETA — what users type into Stripe Checkout
 *
 * Idempotent: safe to run repeatedly; existing objects are reported, not duplicated.
 * Run from the repo root:  node scripts/create-beta-coupon.mjs
 *
 * Reads STRIPE_SECRET_KEY from .env.local. Never prints the key.
 */
import { readFileSync } from "node:fs";
import Stripe from "stripe";

function readEnvLocal(name) {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(new RegExp(`^${name}=(.*)$`));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, "");
  }
  throw new Error(`${name} not found in .env.local`);
}

const stripe = new Stripe(readEnvLocal("STRIPE_SECRET_KEY"), {
  apiVersion: "2025-01-27.acacia",
});

const COUPON_ID = "UPSTREAM-BETA";

async function ensureCoupon() {
  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    console.log(`Coupon already exists: ${existing.id} (${existing.percent_off}% off, ${existing.duration} x${existing.duration_in_months ?? ""}, ${existing.times_redeemed}/${existing.max_redemptions} redeemed)`);
    return existing;
  } catch (err) {
    if (err?.statusCode !== 404) throw err;
  }
  const coupon = await stripe.coupons.create({
    id: COUPON_ID,
    name: "Upstream beta — 3 months of Pro free",
    percent_off: 100,
    duration: "repeating",
    duration_in_months: 3,
    max_redemptions: 20,
  });
  console.log(`Coupon created: ${coupon.id}`);
  return coupon;
}

async function ensurePromotionCode() {
  const existing = await stripe.promotionCodes.list({ code: COUPON_ID, limit: 1 });
  if (existing.data.length > 0) {
    const code = existing.data[0];
    console.log(`Promotion code already exists: ${code.code} (active: ${code.active})`);
    return code;
  }
  const code = await stripe.promotionCodes.create({
    coupon: COUPON_ID,
    code: COUPON_ID,
    max_redemptions: 20,
  });
  console.log(`Promotion code created: ${code.code}`);
  return code;
}

try {
  await ensureCoupon();
  await ensurePromotionCode();
  console.log("");
  console.log("Done. Beta users: Settings → Upgrade → in Stripe Checkout click");
  console.log('"Add promotion code" and enter UPSTREAM-BETA.');
  console.log("Verify in dashboard: Stripe → Product catalog → Coupons.");
} catch (err) {
  console.error("Failed:", err?.message ?? "unknown error");
  process.exitCode = 1;
}
