import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Typed cache-aside helper. On any Redis failure it falls through to the
 * loader — the cache is an optimization, never a dependency.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    // Redis unreachable: serve from source.
  }
  const value = await loader();
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Best-effort write; ignore.
  }
  return value;
}

/**
 * Daily AI budget guard. Returns true if this call is within budget.
 * Fails OPEN on Redis errors: a broken budget counter must not stop
 * classification (the budget protects cost, not correctness).
 */
export async function consumeAiBudget(): Promise<boolean> {
  const key = `ai-budget:${new Date().toISOString().slice(0, 10)}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60 * 60 * 26);
    return count <= env.AI_DAILY_CALL_BUDGET;
  } catch {
    return true;
  }
}
