import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { storageHealthCheck } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  latency: number;
  error?: string;
}

async function check(fn: () => Promise<void>): Promise<CheckResult> {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout after 8000ms")), 8000);
      }),
    ]);
    return { ok: true, latency: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

/**
 * Health endpoint polled by Better Stack every 60s.
 * healthy   → all checks pass
 * degraded  → AI or storage down (product functions, classification queues)
 * unhealthy → database, Redis, or Stripe down (core function impaired)
 */
export async function GET(): Promise<Response> {
  const [database, redisCheck, stripeCheck, ai, storage] = await Promise.all([
    check(async () => {
      await db.$queryRaw`SELECT 1`;
    }),
    check(async () => {
      await redis.ping();
    }),
    check(async () => {
      await stripe.prices.list({ limit: 1 });
    }),
    check(async () => {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      });
      if (!res.ok && res.status !== 429) throw new Error(`HTTP ${res.status}`);
    }),
    check(() => storageHealthCheck()),
  ]);

  const checks = { database, redis: redisCheck, stripe: stripeCheck, ai, storage };
  const coreOk = database.ok && redisCheck.ok && stripeCheck.ok;
  const allOk = coreOk && ai.ok && storage.ok;
  const status = allOk ? "healthy" : coreOk ? "degraded" : "unhealthy";

  return NextResponse.json(
    { status, checks, timestamp: new Date().toISOString() },
    { status: status === "unhealthy" ? 503 : 200 }
  );
}
