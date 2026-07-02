"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary. Zero blank screens: the user always knows what
 * happened (something on our side) and what to do next (retry / go home).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="datum text-xs uppercase tracking-widest text-breach">
        signal interrupted
      </p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-fg">
        Something broke on our side
      </h1>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        The error has already been reported and we watch these closely
        (occupational habit). Your data is safe — try again, or head back to
        your dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
          Dashboard
        </Button>
      </div>
      {error.digest !== undefined ? (
        <p className="datum mt-6 text-xs text-fg-faint">ref: {error.digest}</p>
      ) : null}
    </div>
  );
}
