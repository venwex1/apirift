"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PortalResponse {
  url?: string;
  error?: { message?: string };
}

export function PortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      // Cast: our own API's contract (withErrorHandling guarantees this shape).
      const data = (await res.json()) as PortalResponse;
      if (res.ok && data.url !== undefined) {
        window.location.href = data.url;
        return;
      }
      setError(data.error?.message ?? "Couldn't open the billing portal.");
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" onClick={() => void open()} disabled={pending}>
        {pending ? "Opening…" : "Manage billing"}
      </Button>
      {error !== null ? (
        <span className="text-xs text-breach" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
