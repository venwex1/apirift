import { Resend } from "resend";
import type { ReactElement } from "react";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/errors";
import { db } from "@/lib/db";

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

/**
 * Sends one email with retry. Returns false instead of throwing — callers
 * (alert fan-out, lifecycle cron) treat a failed send as "try next run".
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const result = await withRetry(
      () =>
        resend.emails.send({
          from: env.EMAIL_FROM,
          to: params.to,
          subject: params.subject,
          react: params.react,
          replyTo: params.replyTo,
        }),
      { attempts: 2, baseDelayMs: 750, timeoutMs: 15_000, label: "resend.send" }
    );
    return result.error === null || result.error === undefined;
  } catch {
    return false;
  }
}

/**
 * Lifecycle sends are exactly-once per (user, template), enforced by the DB
 * unique constraint — the insert is the lock. Returns true only when this
 * call both claimed the slot and delivered the email.
 */
export async function sendLifecycleEmail(
  params: SendEmailParams & { userId: string; template: string }
): Promise<boolean> {
  try {
    await db.emailLog.create({
      data: { userId: params.userId, template: params.template },
    });
  } catch {
    return false; // already sent (unique violation) — never double-send
  }
  const delivered = await sendEmail(params);
  if (!delivered) {
    // Release the slot so tomorrow's run retries.
    await db.emailLog
      .deleteMany({
        where: { userId: params.userId, template: params.template },
      })
      .catch(() => undefined);
  }
  return delivered;
}
