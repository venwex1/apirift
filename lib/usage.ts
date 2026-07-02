import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { AppError, ErrorCode } from "@/lib/errors";

export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // "2026-07"
}

/**
 * Atomically consumes one unit of a monthly metered metric.
 * Throws LIMIT_REACHED with a message that names the exact numbers —
 * the upgrade modal renders it verbatim.
 */
export async function consumeMonthlyMetric(
  userId: string,
  plan: Plan,
  metric: "impact_reports"
): Promise<{ used: number; limit: number }> {
  const limit = PLAN_LIMITS[plan].impactReportsPerMonth;
  const period = currentPeriod();

  const counter = await db.usageCounter.upsert({
    where: { userId_metric_period: { userId, metric, period } },
    update: { count: { increment: 1 } },
    create: { userId, metric, period, count: 1 },
  });

  if (counter.count > limit) {
    // Roll back the increment so retries after upgrading aren't penalized.
    await db.usageCounter.update({
      where: { userId_metric_period: { userId, metric, period } },
      data: { count: { decrement: 1 } },
    });
    throw new AppError(
      ErrorCode.LIMIT_REACHED,
      `You've run ${limit} of ${limit} impact reports this month on your current plan.`
    );
  }
  return { used: counter.count, limit };
}

export async function getMonthlyUsage(
  userId: string,
  metric: "impact_reports"
): Promise<number> {
  const counter = await db.usageCounter.findUnique({
    where: {
      userId_metric_period: { userId, metric, period: currentPeriod() },
    },
  });
  return counter?.count ?? 0;
}
