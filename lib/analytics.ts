import { PostHog } from "posthog-node";

/**
 * Server-side product analytics. Every call is fire-and-forget: analytics
 * must never affect a request's outcome or latency budget.
 */
let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key === undefined || key.length === 0) return null;
  if (client === null) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export type AnalyticsEvent =
  | "signup"
  | "watch_added"
  | "watch_removed"
  | "impact_report_created"
  | "impact_report_shared"
  | "limit_hit"
  | "upgrade_started"
  | "upgrade_completed"
  | "subscription_canceled"
  | "referral_recorded"
  | "referral_converted"
  | "alert_sent"
  | "digest_sent";

export function track(
  userId: string,
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>
): void {
  try {
    getClient()?.capture({ distinctId: userId, event, properties });
  } catch {
    // Never let analytics break the product.
  }
}
