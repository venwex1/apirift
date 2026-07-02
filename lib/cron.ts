import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Shared cron harness. Guarantees for every job:
 * - authenticated: requires Authorization: Bearer CRON_SECRET
 * - recorded: a CronRun row for every execution, success or failure
 * - alarmed: 2 consecutive failures of the same job → Sentry event
 * - bounded: jobs receive a deadline and must check `timeLeft()`; the
 *   route-level maxDuration in vercel.json is the hard backstop
 */
export interface CronContext {
  /** Milliseconds remaining before the job should wrap up. */
  timeLeft: () => number;
}

export function cronHandler(
  job: string,
  budgetMs: number,
  run: (ctx: CronContext) => Promise<Record<string, number | string | boolean>>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid cron secret.", requestId: crypto.randomUUID() } },
        { status: 401 }
      );
    }

    const startedAt = Date.now();
    const record = await db.cronRun.create({ data: { job } });

    try {
      const stats = await run({
        timeLeft: () => budgetMs - (Date.now() - startedAt),
      });
      await db.cronRun.update({
        where: { id: record.id },
        data: { finishedAt: new Date(), ok: true, detail: JSON.stringify(stats) },
      });
      return NextResponse.json({ ok: true, job, ...stats });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await db.cronRun
        .update({
          where: { id: record.id },
          data: { finishedAt: new Date(), ok: false, detail },
        })
        .catch(() => undefined);

      const lastTwo = await db.cronRun.findMany({
        where: { job, ok: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 2,
      });
      const twoConsecutiveFailures =
        lastTwo.length === 2 && lastTwo.every((cronRun) => cronRun.ok === false);

      Sentry.captureException(err, {
        tags: { job, consecutive: String(twoConsecutiveFailures) },
        level: twoConsecutiveFailures ? "error" : "warning",
      });

      return NextResponse.json(
        { ok: false, job, error: detail },
        { status: 500 }
      );
    }
  };
}
