import { db } from "@/lib/db";
import { cronHandler } from "@/lib/cron";
import { sendLifecycleEmail } from "@/lib/email";
import { env } from "@/lib/env";
import Day3ActiveEmail from "@/emails/day3-active";
import Day3InactiveEmail from "@/emails/day3-inactive";
import Day7TipEmail from "@/emails/day7-tip";
import Day14FeedbackEmail from "@/emails/day14-feedback";
import Day30WinbackEmail from "@/emails/day30-winback";
import UpgradePromptEmail from "@/emails/upgrade-prompt";
import { PLAN_LIMITS } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Daily 14:00 UTC. Each template fires at most once per user, ever — enforced
 * by the EmailLog unique constraint inside sendLifecycleEmail. Date windows
 * are ranges, not exact days, so a missed run self-heals the next day.
 */
export const GET = cronHandler("lifecycle-emails", 110_000, async (ctx) => {
  let sentTotal = 0;

  // Day 3: split by whether they've added a watch.
  const day3Users = await db.user.findMany({
    where: {
      createdAt: { lte: daysAgo(3), gte: daysAgo(6) },
      emailLogs: { none: { template: { in: ["day3_active", "day3_inactive"] } } },
    },
    select: { id: true, email: true, name: true, _count: { select: { watches: true } } },
    take: 500,
  });
  for (const user of day3Users) {
    if (ctx.timeLeft() < 10_000) break;
    const active = user._count.watches > 0;
    const ok = await sendLifecycleEmail({
      userId: user.id,
      template: active ? "day3_active" : "day3_inactive",
      to: user.email,
      subject: active
        ? "The feature most Upstream users find on day 30 (find it on day 3)"
        : "One paste. That's the whole setup.",
      react: active
        ? Day3ActiveEmail({ name: user.name })
        : Day3InactiveEmail({ name: user.name }),
    });
    if (ok) sentTotal++;
  }

  // Day 7: power tip, only for users actually using the product.
  const day7Users = await db.user.findMany({
    where: {
      createdAt: { lte: daysAgo(7), gte: daysAgo(10) },
      watches: { some: {} },
      emailLogs: { none: { template: "day7_tip" } },
    },
    select: { id: true, email: true, name: true },
    take: 500,
  });
  for (const user of day7Users) {
    if (ctx.timeLeft() < 10_000) break;
    const ok = await sendLifecycleEmail({
      userId: user.id,
      template: "day7_tip",
      to: user.email,
      subject: "Deadlines your stack already knows about",
      react: Day7TipEmail({ name: user.name }),
    });
    if (ok) sentTotal++;
  }

  // Day 14: one question, replies to the founder.
  const day14Users = await db.user.findMany({
    where: {
      createdAt: { lte: daysAgo(14), gte: daysAgo(17) },
      emailLogs: { none: { template: "day14_feedback" } },
    },
    select: { id: true, email: true, name: true },
    take: 500,
  });
  for (const user of day14Users) {
    if (ctx.timeLeft() < 10_000) break;
    const ok = await sendLifecycleEmail({
      userId: user.id,
      template: "day14_feedback",
      to: user.email,
      subject: "One question about Upstream",
      react: Day14FeedbackEmail({ name: user.name }),
      replyTo: env.FOUNDER_EMAIL,
    });
    if (ok) sentTotal++;
  }

  // Day 30: win-back for users who never came back.
  const day30Users = await db.user.findMany({
    where: {
      createdAt: { lte: daysAgo(30), gte: daysAgo(34) },
      lastActiveAt: { lte: daysAgo(21) },
      emailLogs: { none: { template: "day30_winback" } },
    },
    select: { id: true, email: true, name: true },
    take: 500,
  });
  for (const user of day30Users) {
    if (ctx.timeLeft() < 10_000) break;
    const ok = await sendLifecycleEmail({
      userId: user.id,
      template: "day30_winback",
      to: user.email,
      subject: "Your stack changed 14 times since you left",
      react: Day30WinbackEmail({ name: user.name }),
    });
    if (ok) sentTotal++;
  }

  // Upgrade prompt: free users at their watch limit, sent once ever.
  const freeLimit = PLAN_LIMITS.FREE.maxWatches;
  const limitUsers = await db.user.findMany({
    where: {
      plan: "FREE",
      emailLogs: { none: { template: "upgrade_prompt" } },
    },
    select: { id: true, email: true, name: true, _count: { select: { watches: true } } },
    take: 500,
  });
  for (const user of limitUsers) {
    if (ctx.timeLeft() < 10_000) break;
    if (user._count.watches < freeLimit) continue;
    const ok = await sendLifecycleEmail({
      userId: user.id,
      template: "upgrade_prompt",
      to: user.email,
      subject: `You're watching ${freeLimit} of ${freeLimit} — the rest of your stack is unwatched`,
      react: UpgradePromptEmail({ name: user.name, watchCount: user._count.watches }),
    });
    if (ok) sentTotal++;
  }

  return { sent: sentTotal };
});
