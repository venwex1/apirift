import { db } from "@/lib/db";
import { cronHandler } from "@/lib/cron";
import { putObject } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Sunday 03:00 UTC: JSON export of critical user data to R2.
 * Neon PITR is the primary backup; this is the independent, provider-diverse
 * copy. Keys are date-stamped; R2 lifecycle rule (set in dashboard) expires
 * objects after 90 days.
 */
export const GET = cronHandler("backup-export", 280_000, async () => {
  const stamp = new Date().toISOString().slice(0, 10);

  const [users, watches, projects, referrals] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        email: true,
        plan: true,
        stripeCustomerId: true,
        referralCode: true,
        referredById: true,
        createdAt: true,
      },
    }),
    db.watch.findMany({
      select: { userId: true, providerId: true, muted: true, createdAt: true },
    }),
    db.project.findMany({
      select: { id: true, userId: true, name: true, manifest: true, createdAt: true },
    }),
    db.referral.findMany(),
  ]);

  await putObject(
    `exports/${stamp}/core.json`,
    JSON.stringify({ exportedAt: new Date().toISOString(), users, watches, projects, referrals })
  );

  // The registry + change history is the moat — back it up too.
  const providers = await db.provider.findMany({ include: { sources: true } });
  const recentChanges = await db.change.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) } },
  });
  await putObject(
    `exports/${stamp}/registry.json`,
    JSON.stringify({ providers, recentChanges })
  );

  return { users: users.length, watches: watches.length, changes: recentChanges.length };
});
