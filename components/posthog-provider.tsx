"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { useAuth } from "@clerk/nextjs";

/**
 * Client analytics. Initializes only when a key is configured; identifies
 * the Clerk user so server and client events join on the same distinct id.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key === undefined || key.length === 0) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      persistence: "localStorage+cookie",
    });
  }, []);

  useEffect(() => {
    if (userId !== null && userId !== undefined) {
      posthog.identify(userId);
    }
  }, [userId]);

  return <>{children}</>;
}
