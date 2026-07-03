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
 * Health endpoint. Consumed by Better Stack (60s), the CI quality gates
 * (checkpoints 3–5), and humans.
 *
 * Contract (stable — CI scripts assert on these fields):
 *   status    "ok" | "degraded" | "down" — computed from db + redis + resend:
 *             all pass → ok, some pass → degraded, none pass → down
 *   db        boolean
 *   redis     boolean
 *   resend    boolean
 *   timestamp ISO 8601
 *   checks    per-service detail incl. stripe/ai/storage (informational)
 *
 * HTTP status: 503 when status is "down" OR the database is unreachable
 * (db is existential — uptime alerting must fire even if redis/resend
 * happen to be fine); 200 otherwise.
 */
export async function GET(): Promise<Response> {
  const [database, redisCheck, resendCheck, stripeCheck, ai, storage] =
    await Promise.all([
      check(async () => {
        await db.$queryRaw`SELECT 1`;
      }),
      check(async () => {
        await redis.ping();
      }),
      check(async () => {
        const res = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
        });
        // 2xx = reachable + authed. 429 = reachable, rate limited — still up.
        if (!res.ok && res.status !== 429) throw new Error(`HTTP ${res.status}`);
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

  const core = [database.ok, redisCheck.ok, resendCheck.ok];
  const passing = core.filter(Boolean).length;
  const status: "ok" | "degraded" | "down" =
    passing === core.length ? "ok" : passing > 0 ? "degraded" : "down";

  return NextResponse.json(
    {
      status,
      db: database.ok,
      redis: redisCheck.ok,
      resend: resendCheck.ok,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis: redisCheck,
        resend: resendCheck,
        stripe: stripeCheck,
        ai,
        storage,
      },
    },
    { status: status === "down" || !database.ok ? 503 : 200 }
  );
}
