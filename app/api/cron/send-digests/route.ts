import { db } from "@/lib/db";
import { cronHandler } from "@/lib/cron";
import { sendEmail } from "@/lib/email";
import { track } from "@/lib/analytics";
import WeeklyDigestEmail, { type DigestChange } from "@/emails/weekly-digest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Monday 09:00 UTC: one email per user summarizing the week across their
 * watched providers. Idempotent per ISO week via Alert rows with channel
 * DIGEST keyed to a synthetic marker — simpler: we only select users who have
 * no DIGEST alert created in the past 6 days, so a re-run skips them.
 */
export const GET = cronHandler("send-digests", 280_000, async (ctx) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

  const users = await db.user.findMany({
    where: {
      watches: { some: { muted: false } },
      alerts: { none: { channel: "DIGEST", createdAt: { gte: sixDaysAgo } } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      watches: { where: { muted: false }, select: { providerId: true } },
    },
    take: 2000,
  });

  let sentCount = 0;
  for (const user of users) {
    if (ctx.timeLeft() < 20_000) break;

    const providerIds = user.watches.map((watch) => watch.providerId);
    const changes = await db.change.findMany({
      where: {
        providerId: { in: providerIds },
        status: "CLASSIFIED",
        createdAt: { gte: weekAgo },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 40,
      include: { provider: { select: { name: true, slug: true } } },
    });

    const digestChanges: DigestChange[] = changes.map((change) => ({
      providerName: change.provider.name,
      providerSlug: change.provider.slug,
      title: change.title,
      kind: change.kind ?? "NOTICE",
      severity: change.severity ?? "INFO",
      summary: change.summary ?? "",
      url: change.url,
    }));

    // Claim idempotency marker BEFORE sending. If the send fails, the marker
    // is removed so next run retries. A crash between claim and send costs
    // one user one weekly digest — acceptable; the alternative double-sends.
    const marker = changes[0];
    if (marker !== undefined) {
      const claim = await db.alert.createMany({
        data: [{ userId: user.id, changeId: marker.id, channel: "DIGEST" as const }],
        skipDuplicates: true,
      });
      if (claim.count === 0) continue;
    }

    const quiet = digestChanges.length === 0;
    const delivered = await sendEmail({
      to: user.email,
      subject: quiet
        ? "Your stack: all quiet this week"
        : `Your stack this week: ${digestChanges.length} changes worth knowing`,
      react: WeeklyDigestEmail({
        name: user.name,
        changes: digestChanges,
        isFreePlan: user.plan === "FREE",
      }),
    });

    if (delivered) {
      sentCount++;
      track(user.id, "digest_sent", { changes: digestChanges.length });
      if (marker !== undefined) {
        await db.alert.updateMany({
          where: { userId: user.id, changeId: marker.id, channel: "DIGEST" },
          data: { sentAt: new Date() },
        });
      }
    } else if (marker !== undefined) {
      await db.alert.deleteMany({
        where: { userId: user.id, changeId: marker.id, channel: "DIGEST", sentAt: null },
      });
    }
  }

  return { eligible: users.length, sent: sentCount };
});
