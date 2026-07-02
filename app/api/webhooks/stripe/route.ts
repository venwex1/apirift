import { NextResponse } from "next/server";
import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe, planForPriceId, grantReferralCredit } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { track } from "@/lib/analytics";
import PaymentFailedEmail from "@/emails/payment-failed";

/**
 * Stripe webhook handler.
 * Idempotency: every event id is inserted into WebhookEvent first; a unique
 * violation means we've already processed it and we return 200 immediately.
 * Duplicate deliveries and out-of-order retries are therefore safe.
 * Errors return 500 so Stripe retries (up to 72h).
 */
export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (signature === null) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await db.webhookEvent.create({
      data: { id: event.id, source: "stripe", type: event.type },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          await syncSubscription(session.subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object.id);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await db.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (user !== null) {
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              stripeSubscriptionId: null,
              planRenewsAt: null,
              cancelAtPeriodEnd: false,
              attributionRemoved: false,
            },
          });
          track(user.id, "subscription_canceled");
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId !== undefined) {
          const user = await db.user.findUnique({
            where: { stripeCustomerId: customerId },
          });
          if (user !== null) {
            await sendEmail({
              to: user.email,
              subject: "Your Upstream payment didn't go through",
              react: PaymentFailedEmail({ name: user.name }),
            });
          }
        }
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // Release the idempotency claim so Stripe's retry can reprocess.
    await db.webhookEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    Sentry.captureException(err, { tags: { webhook: "stripe", eventType: event.type } });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

/** Single source of truth for mapping a Stripe subscription onto a User. */
async function syncSubscription(subscriptionId: string): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata["userId"];
  if (userId === undefined) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId !== undefined ? planForPriceId(priceId) : null;
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  const previous = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      plan: isActive && plan !== null ? plan : "FREE",
      stripeSubscriptionId: subscription.id,
      planRenewsAt: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // First transition to paid: complete the referral loop, both sides credited.
  if (previous !== null && previous.plan === "FREE" && isActive && plan !== null) {
    track(userId, "upgrade_completed", { plan });
    await rewardReferralIfAny(userId);
  }
}

/**
 * Referral reward on conversion: referrer and referred each receive one month
 * of Pro value ($12) as Stripe balance credit. State machine PENDING →
 * CONVERTED → REWARDED guarantees exactly-once, even across webhook retries.
 */
async function rewardReferralIfAny(referredUserId: string): Promise<void> {
  const referral = await db.referral.findUnique({
    where: { referredId: referredUserId },
    include: { referrer: { select: { id: true, stripeCustomerId: true } } },
  });
  if (referral === null || referral.status !== "PENDING") return;

  await db.referral.update({
    where: { id: referral.id },
    data: { status: "CONVERTED", convertedAt: new Date() },
  });

  const referred = await db.user.findUnique({
    where: { id: referredUserId },
    select: { stripeCustomerId: true },
  });

  try {
    if (referral.referrer.stripeCustomerId !== null) {
      await grantReferralCredit(referral.referrer.stripeCustomerId);
    }
    if (referred?.stripeCustomerId != null) {
      await grantReferralCredit(referred.stripeCustomerId);
    }
    await db.referral.update({
      where: { id: referral.id },
      data: { status: "REWARDED", rewardedAt: new Date() },
    });
    track(referral.referrer.id, "referral_converted");
  } catch (err) {
    // Stays CONVERTED; Sentry alert prompts investigation, no double-credit risk.
    Sentry.captureException(err, { tags: { flow: "referral-reward" } });
  }
}
