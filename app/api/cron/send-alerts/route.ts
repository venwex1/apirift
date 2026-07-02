import { db } from "@/lib/db";
import { cronHandler } from "@/lib/cron";
import { sendEmail } from "@/lib/email";
import { track } from "@/lib/analytics";
import { withRetry } from "@/lib/errors";
import InstantAlertEmail from "@/emails/instant-alert";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ALERT_WINDOW_HOURS = 48;

/**
 * Every 15 minutes: fan out instant alerts for high-severity classified
 * changes to watchers on paid plans.
 *
 * Idempotency is structural: the unique (userId, changeId, channel) index
 * means createMany(skipDuplicates) claims exactly the deliveries that have
 * never been attempted; unsent rows (sentAt=null) from a previous crashed run
 * are picked up again. At-least-once delivery, exactly-once creation.
 */
export const GET = cronHandler("send-alerts", 110_000, async (ctx) => {
  const since = new Date(Date.now() - ALERT_WINDOW_HOURS * 60 * 60 * 1000);

  const changes = await db.change.findMany({
    where: {
      status: "CLASSIFIED",
      severity: { in: ["CRITICAL", "HIGH"] },
      classifiedAt: { gte: since },
    },
    include: { provider: { select: { id: true, name: true, slug: true } } },
  });

  let created = 0;
  for (const change of changes) {
    const watchers = await db.watch.findMany({
      where: {
        providerId: change.provider.id,
        muted: false,
        user: { plan: { in: ["PRO", "TEAM"] } },
      },
      select: { userId: true },
    });
    if (watchers.length === 0) continue;
    const result = await db.alert.createMany({
      data: watchers.map((watcher) => ({
        userId: watcher.userId,
        changeId: change.id,
        channel: "EMAIL" as const,
      })),
      skipDuplicates: true,
    });
    created += result.count;
  }

  const unsent = await db.alert.findMany({
    where: { channel: "EMAIL", sentAt: null },
    take: 200,
    include: {
      user: { select: { email: true, name: true } },
      change: { include: { provider: { select: { name: true, slug: true } } } },
    },
  });

  let sent = 0;
  for (const alert of unsent) {
    if (ctx.timeLeft() < 15_000) break;
    const delivered = await sendEmail({
      to: alert.user.email,
      subject: `[${alert.change.severity ?? "HIGH"}] ${alert.change.provider.name}: ${alert.change.title}`,
      react: InstantAlertEmail({
        name: alert.user.name,
        providerName: alert.change.provider.name,
        providerSlug: alert.change.provider.slug,
        title: alert.change.title,
        severity: alert.change.severity ?? "HIGH",
        summary: alert.change.summary ?? alert.change.title,
        actionRequired: alert.change.actionRequired,
        url: alert.change.url,
      }),
    });
    if (delivered) {
      await db.alert.update({ where: { id: alert.id }, data: { sentAt: new Date() } });
      track(alert.userId, "alert_sent", { provider: alert.change.provider.slug });
      sent++;
    }
  }

  // Team plan: outgoing webhooks, fired per unsent WEBHOOK alert.
  let webhooksSent = 0;
  const teamWatchers = await db.alert.findMany({
    where: { channel: "WEBHOOK", sentAt: null },
    take: 100,
    include: {
      user: { select: { id: true, plan: true, projects: { select: { webhookUrl: true } } } },
      change: { include: { provider: { select: { name: true, slug: true } } } },
    },
  });
  for (const alert of teamWatchers) {
    if (ctx.timeLeft() < 10_000) break;
    const url = alert.user.projects.find((project) => project.webhookUrl !== null)?.webhookUrl;
    if (url === undefined || url === null || alert.user.plan !== "TEAM") {
      await db.alert.update({ where: { id: alert.id }, data: { sentAt: new Date() } });
      continue;
    }
    try {
      await withRetry(
        async () => {
          const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              type: "upstream.alert",
              provider: alert.change.provider.slug,
              severity: alert.change.severity,
              kind: alert.change.kind,
              title: alert.change.title,
              summary: alert.change.summary,
              actionRequired: alert.change.actionRequired,
              url: alert.change.url,
            }),
          });
          if (!res.ok) throw new Error(`webhook HTTP ${res.status}`);
        },
        { attempts: 2, baseDelayMs: 500, timeoutMs: 10_000, label: "alert-webhook" }
      );
      webhooksSent++;
    } catch {
      // Leave unsent; retried next run. Endpoint failures are the user's to fix.
    }
    await db.alert.update({ where: { id: alert.id }, data: { sentAt: new Date() } });
  }

  return { created, sent, webhooksSent, backlog: unsent.length - sent };
});
