"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/app/upgrade-modal";

interface WatchButtonProps {
  providerSlug: string;
  watching: boolean;
}

interface ApiError {
  error?: { code?: string; message?: string };
}

export function WatchButton({ providerSlug, watching }: WatchButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/watches", {
        method: watching ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ providerSlug }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      // Cast: our own API's contract (withErrorHandling guarantees this shape).
      const data = (await res.json()) as ApiError;
      if (data.error?.code === "LIMIT_REACHED") {
        setUpgradeReason(data.error.message ?? "You've hit your plan's watch limit.");
      } else {
        setError(data.error?.message ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button
          variant={watching ? "secondary" : "primary"}
          size="sm"
          onClick={() => void toggle()}
          disabled={pending}
          aria-pressed={watching}
        >
          {watching ? <EyeOff size={14} /> : <Eye size={14} />}
          {pending ? "…" : watching ? "Watching" : "Watch"}
        </Button>
        {error !== null ? (
          <span className="text-xs text-breach" role="alert">
            {error}
          </span>
        ) : null}
      </div>
      <UpgradeModal
        open={upgradeReason !== null}
        onClose={() => setUpgradeReason(null)}
        reason={upgradeReason ?? ""}
      />
    </>
  );
}
