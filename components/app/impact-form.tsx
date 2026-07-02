"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { UpgradeModal } from "@/components/app/upgrade-modal";

interface ApiError {
  error?: { code?: string; message?: string };
}

interface ImpactResponse {
  publicUrl?: string;
  report?: { publicId: string };
}

export function ImpactForm() {
  const router = useRouter();
  const [manifest, setManifest] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manifestJson: manifest }),
      });
      // Cast: our own API's contract (withErrorHandling guarantees this shape).
      const data = (await res.json()) as ImpactResponse & ApiError;
      if (res.ok && data.report !== undefined) {
        router.push(`/r/${data.report.publicId}`);
        return;
      }
      if (data.error?.code === "LIMIT_REACHED") {
        setUpgradeReason(data.error.message ?? "Monthly report limit reached.");
      } else {
        setError(data.error?.message ?? "Analysis failed. Try again.");
      }
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="manifest" className="block text-sm font-medium text-fg">
        Paste your package.json
      </label>
      <Textarea
        id="manifest"
        rows={12}
        value={manifest}
        onChange={(event) => setManifest(event.target.value)}
        placeholder={'{\n  "dependencies": {\n    "stripe": "^17.0.0",\n    "openai": "^4.0.0"\n  }\n}'}
        aria-describedby="manifest-hint"
      />
      <p id="manifest-hint" className="text-xs text-fg-faint">
        Analyzed in memory against the registry. We store the dependency names
        for your report — never versions private to your build.
      </p>
      {error !== null ? (
        <p className="text-sm text-breach" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        onClick={() => void submit()}
        disabled={pending || manifest.trim().length === 0}
        size="lg"
      >
        <FileSearch size={16} />
        {pending ? "Scanning your stack…" : "Run impact report"}
      </Button>
      <UpgradeModal
        open={upgradeReason !== null}
        onClose={() => setUpgradeReason(null)}
        reason={upgradeReason ?? ""}
      />
    </div>
  );
}
