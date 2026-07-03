import Stripe from "stripe";
import { env } from "@/lib/env";
import { AppError, ErrorCode, withRetry } from "@/lib/errors";
import type { BillingInterval, PaidPlan } from "@/lib/plans";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

const PRICE_IDS: Record<PaidPlan, Record<BillingInterval, string>> = {
  PRO: {
    month: env.STRIPE_PRICE_PRO_MONTHLY,
    year: env.STRIPE_PRICE_PRO_YEARLY,
  },
  TEAM: {
    month: env.STRIPE_PRICE_TEAM_MONTHLY,
    year: env.STRIPE_PRICE_TEAM_YEARLY,
  },
};

export function priceIdFor(plan: PaidPlan, interval: BillingInterval): string {
  return PRICE_IDS[plan][interval];
}

/** Reverse lookup used by the webhook handler to map subscription \u2192 plan. */
export function planForPriceId(priceId: string): PaidPlan | null {
  for (const plan of ["PRO", "TEAM"] as const) {
    for (const interval of ["month", "year"] as const) {
      if (PRICE_IDS[plan][interval] === priceId) return plan;
    }
  }
  return null;
}

export async function createCheckoutSession(params: {
  customerId: string;
  plan: PaidPlan;
  interval: BillingInterval;
  userId: string;
}): Promise<string> {
  try {
    const session = await withRetry(
      () =>
        stripe.checkout.sessions.create({
          customer: params.customerId,
          mode: "subscription",
          line_items: [
            { price: priceIdFor(params.plan, params.interval), quantity: 1 },
          ],
          allow_promotion_codes: true,
          subscription_data: { metadata: { userId: params.userId } },
          success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
          cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
        }),
      { attempts: 2, baseDelayMs: 500, timeoutMs: 15_000, label: "stripe.checkout" }
    );
    if (session.url === null) {
      throw new AppError(
        ErrorCode.STRIPE_ERROR,
        "Stripe didn't return a checkout link. Try again in a minute."
      );
    }
    return session.url;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCode.STRIPE_ERROR,
      "Stripe is having trouble right now. Your card was not charged \u2014 try again in a minute."
    );
  }
}

export async function createPortalSession(customerId: string): Promise<string> {
  try {
    const session = await withRetry(
      () =>
        stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${env.NEXT_PUBLIC_APP_URL}/settings`,
        }),
      { attempts: 2, baseDelayMs: 500, timeoutMs: 15_000, label: "stripe.portal" }
    );
    return session.url;
  } catch {
    throw new AppError(
      ErrorCode.STRIPE_ERROR,
      "Couldn't open the billing portal. Try again in a minute."
    );
  }
}

export async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (user.stripeCustomerId !== null) return user.stripeCustomerId;
  try {
    const customer = await withRetry(
      () =>
        stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        }),
      { attempts: 2, baseDelayMs: 500, timeoutMs: 15_000, label: "stripe.customer" }
    );
    return customer.id;
  } catch {
    throw new AppError(
      ErrorCode.STRIPE_ERROR,
      "Couldn't reach Stripe to set up billing. Try again in a minute."
    );
  }
}

/**
 * Referral reward: one month of Pro value ($12) as Stripe customer balance
 * credit, applied automatically against the next invoice. No manual steps.
 */
export async function grantReferralCredit(customerId: string): Promise<void> {
  await withRetry(
    () =>
      stripe.customers.createBalanceTransaction(customerId, {
        amount: -1200, // negative = credit, in cents
        currency: "usd",
        description: "Upstream referral reward \u2014 one month of Pro on us",
      }),
    { attempts: 3, baseDelayMs: 1000, timeoutMs: 15_000, label: "stripe.credit" }
  );
  }
