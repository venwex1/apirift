"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Catches errors thrown by the root layout itself. Deliberately dependency-
 * free (no design system imports) — if we're here, assume nothing works.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#06080D", color: "#E8EDF4", fontFamily: "system-ui", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Something broke on our side</h1>
          <p style={{ color: "#8A94A6", maxWidth: "420px", marginTop: "8px" }}>
            It has been reported automatically. Reload the page — if this
            persists for more than a few minutes, our monitoring has already
            paged the founder.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", background: "#2EE6A8", color: "#06080D", border: 0, borderRadius: "8px", padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
