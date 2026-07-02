import { db } from "@/lib/db";
import { cronHandler } from "@/lib/cron";
import { classifyChange } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 40;

/**
 * Every 15 minutes: classify PENDING changes with Claude Haiku.
 * - budget exhausted → stop; the backlog waits for tomorrow (cost guard)
 * - AI unavailable → stop; next run retries (attempts not consumed)
 * - unparseable → attempts++, at 3 the change becomes FAILED and is shown
 *   unclassified rather than dropped. Nothing is ever lost.
 */
export const GET = cronHandler("classify-changes", 280_000, async (ctx) => {
  const pending = await db.change.findMany({
    where: { status: "PENDING", classificationAttempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    include: { provider: { select: { name: true } } },
  });

  let classified = 0;
  let deferred = 0;
  let exhausted = 0;

  for (const change of pending) {
    if (ctx.timeLeft() < 40_000) break;

    const result = await classifyChange({
      providerName: change.provider.name,
      title: change.title,
      excerpt: change.rawExcerpt,
      publishedAt: change.publishedAt?.toISOString() ?? null,
    });

    if (result.ok) {
      const effectiveAt =
        result.classification.effectiveAt !== null &&
        !Number.isNaN(Date.parse(result.classification.effectiveAt))
          ? new Date(result.classification.effectiveAt)
          : null;
      await db.change.update({
        where: { id: change.id },
        data: {
          status: "CLASSIFIED",
          classifiedAt: new Date(),
          kind: result.classification.kind,
          severity: result.classification.severity,
          summary: result.classification.summary,
          affectedSurfaces: result.classification.affectedSurfaces,
          actionRequired: result.classification.actionRequired,
          effectiveAt,
        },
      });
      classified++;
      continue;
    }

    if (result.reason === "budget" || result.reason === "unavailable") {
      deferred++;
      break; // no point burning through the rest of the batch
    }

    const attempts = change.classificationAttempts + 1;
    await db.change.update({
      where: { id: change.id },
      data: {
        classificationAttempts: attempts,
        status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
      },
    });
    if (attempts >= MAX_ATTEMPTS) exhausted++;
  }

  return { batch: pending.length, classified, deferred, exhausted };
});
