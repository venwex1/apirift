import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";
import { createCheckoutSession, ensureStripeCustomer } from "@/lib/stripe";
import { track } from "@/lib/analytics";

const bodySchema = z.object({
  plan: z.enum(["PRO", "TEAM"]),
  interval: z.enum(["month", "year"]),
});

export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Choose a plan and billing interval.");
  }

  const customerId = await ensureStripeCustomer(user);
  if (user.stripeCustomerId === null) {
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const url = await createCheckoutSession({
    customerId,
    plan: parsed.data.plan,
    interval: parsed.data.interval,
    userId: user.id,
  });

  track(user.id, "upgrade_started", {
    plan: parsed.data.plan,
    interval: parsed.data.interval,
  });

  return NextResponse.json({ url });
});
