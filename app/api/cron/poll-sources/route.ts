import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { cronHandler } from "@/lib/cron";
import { fetchSourceBody, extractEntries, sha256 } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SOURCE_DISABLE_THRESHOLD = 5;

/**
 * Every 30 minutes: fetch each enabled source, oldest-checked first.
 * Content-hash short-circuit makes unchanged sources nearly free.
 * A source that fails 5 consecutive polls self-disables and reports itself
 * ("source rot") — the registry heals instead of silently decaying.
 */
export const GET = cronHandler("poll-sources", 280_000, async (ctx) => {
  const sources = await db.source.findMany({
    where: { enabled: true },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
    include: { provider: { select: { id: true } } },
  });

  let polled = 0;
  let changed = 0;
  let inserted = 0;
  let failed = 0;

  for (const source of sources) {
    if (ctx.timeLeft() < 25_000) break;
    polled++;

    try {
      const body = await fetchSourceBody(source.url);
      const hash = sha256(body);
      if (hash === source.lastHash) {
        await db.source.update({
          where: { id: source.id },
          data: { lastCheckedAt: new Date(), lastOkAt: new Date(), consecutiveFailures: 0 },
        });
        continue;
      }

      changed++;
      const entries = extractEntries(source.type, body, source.url);
      for (const entry of entries) {
        const result = await db.change.createMany({
          data: [
            {
              providerId: source.provider.id,
              sourceId: source.id,
              externalKey: entry.externalKey,
              title: entry.title,
              url: entry.url,
              publishedAt: entry.publishedAt,
              rawExcerpt: entry.excerpt,
            },
          ],
          skipDuplicates: true,
        });
        inserted += result.count;
      }

      await db.source.update({
        where: { id: source.id },
        data: {
          lastHash: hash,
          lastCheckedAt: new Date(),
          lastOkAt: new Date(),
          consecutiveFailures: 0,
        },
      });
    } catch (err) {
      failed++;
      const failures = source.consecutiveFailures + 1;
      const disable = failures >= SOURCE_DISABLE_THRESHOLD;
      await db.source.update({
        where: { id: source.id },
        data: { lastCheckedAt: new Date(), consecutiveFailures: failures, enabled: !disable },
      });
      if (disable) {
        Sentry.captureMessage(
          `Source rot: auto-disabled after ${failures} failures: ${source.url}`,
          { level: "warning", tags: { flow: "poll-sources" }, extra: { error: err instanceof Error ? err.message : String(err) } }
        );
      }
    }
  }

  return { polled, changed, inserted, failed, total: sources.length };
});
