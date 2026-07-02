"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAN_PRICES } from "@/lib/plans";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** The specific limit message from the API, rendered verbatim. */
  reason: string;
}

interface CheckoutResponse {
  url?: string;
  error?: { message: string };
}

/**
 * Contextual upgrade: names the exact limit that was hit, shows the annual
 * saving, and is one click from Stripe Checkout. No generic "unlock more".
 */
export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "PRO", interval }),
      });
      // Cast: our own API's contract (withErrorHandling guarantees this shape).
      const data = (await res.json()) as CheckoutResponse;
      if (res.ok && data.url !== undefined) {
        window.location.href = data.url;
        return;
      }
      setError(data.error?.message ?? "Couldn't start checkout. Try again.");
    } catch {
      setError("Network hiccup — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const yearly = PLAN_PRICES.PRO.yearly;
  const monthly = PLAN_PRICES.PRO.monthly;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="upgrade-title">
      <h2 id="upgrade-title" className="font-display text-lg font-semibold text-fg">
        Your stack is bigger than your plan
      </h2>
      <p className="mt-2 text-sm text-fg-muted">{reason}</p>
      <p className="mt-1 text-sm text-fg-muted">
        Pro watches your entire stack, sends alerts within minutes instead of a
        weekly digest, and runs 50 impact reports a month.
      </p>

      <div className="mt-5 flex gap-2" role="radiogroup" aria-label="Billing interval">
        <button
          role="radio"
          aria-checked={interval === "year"}
          onClick={() => setInterval("year")}
          className={`flex-1 rounded-lg border p-3 text-left transition-colors duration-200 ease-needle ${
            interval === "year"
              ? "border-signal/50 bg-signal-faint"
              : "border-line bg-ink-800 hover:border-line-strong"
          }`}
        >
          <div className="datum text-sm font-semibold text-fg">
            ${Math.round(yearly / 12)}/mo
          </div>
          <div className="text-xs text-fg-muted">billed ${yearly}/year</div>
          <div className="mt-1 text-xs font-medium text-signal">Save 20%</div>
        </button>
        <button
          role="radio"
          aria-checked={interval === "month"}
          onClick={() => setInterval("month")}
          className={`flex-1 rounded-lg border p-3 text-left transition-colors duration-200 ease-needle ${
            interval === "month"
              ? "border-signal/50 bg-signal-faint"
              : "border-line bg-ink-800 hover:border-line-strong"
          }`}
        >
          <div className="datum text-sm font-semibold text-fg">${monthly}/mo</div>
          <div className="text-xs text-fg-muted">billed monthly</div>
        </button>
      </div>

      {error !== null ? (
        <p className="mt-3 text-sm text-breach" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-4 w-full"
        size="lg"
        onClick={() => void startCheckout()}
        disabled={loading}
      >
        {loading ? "Opening checkout…" : "Upgrade to Pro"}
      </Button>
      <p className="mt-3 text-center text-xs text-fg-faint">
        Cancel anytime from Settings. No emails asking why.
      </p>
    </Dialog>
  );
}
