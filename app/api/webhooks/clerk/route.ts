import { NextResponse } from "next/server";
import { Webhook } from "svix";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { generateReferralCode, recordReferral } from "@/lib/referral";
import { sendLifecycleEmail } from "@/lib/email";
import { track } from "@/lib/analytics";
import WelcomeEmail from "@/emails/welcome";

interface ClerkUserCreatedEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    unsafe_metadata?: { referralCode?: string };
  };
}

/**
 * Clerk → app user sync. Signature-verified via Svix. Idempotent via upsert
 * plus the WebhookEvent ledger. Also the trigger point for the welcome email
 * and referral attribution (the referral code rides in unsafe_metadata,
 * written by the sign-up page from the ?ref= cookie).
 */
export async function POST(req: Request): Promise<Response> {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (svixId === null || svixTimestamp === null || svixSignature === null) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  let event: ClerkUserCreatedEvent;
  try {
    const payload = await req.text();
    const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET);
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent; // svix verify() returns unknown; shape guaranteed by the Clerk-signed payload + event.type check below // svix verify() returns unknown; shape is guaranteed by Clerk-signed payload + event.type check below
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ received: true });
  }

  try {
    await db.webhookEvent.create({
      data: { id: svixId, source: "clerk", type: event.type },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const email = event.data.email_addresses[0]?.email_address;
    if (email === undefined) return NextResponse.json({ received: true });

    const user = await db.user.upsert({
      where: { id: event.data.id },
      update: {},
      create: {
        id: event.data.id,
        email,
        name: event.data.first_name,
        referralCode: generateReferralCode(),
      },
    });

    const referralCode = event.data.unsafe_metadata?.referralCode;
    if (typeof referralCode === "string" && referralCode.length > 0) {
      await recordReferral(user.id, referralCode);
      track(user.id, "referral_recorded");
    }

    track(user.id, "signup");
    await sendLifecycleEmail({
      userId: user.id,
      template: "welcome",
      to: email,
      subject: "Your stack is now being watched",
      react: WelcomeEmail({ name: user.name }),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    await db.webhookEvent.delete({ where: { id: svixId } }).catch(() => undefined);
    Sentry.captureException(err, { tags: { webhook: "clerk" } });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
