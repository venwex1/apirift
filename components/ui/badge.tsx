import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "signal" | "ember" | "breach" | "pulse" | "neutral";

const tones: Record<BadgeTone, string> = {
  signal: "bg-signal-faint text-signal border-signal/25",
  ember: "bg-ember-faint text-ember border-ember/25",
  breach: "bg-breach-faint text-breach border-breach/25",
  pulse: "bg-pulse-faint text-pulse border-pulse/25",
  neutral: "bg-ink-800 text-fg-muted border-line",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "datum inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

/** Maps a Change severity/kind to a visual tone. Red only for real breakage. */
export function toneForSeverity(severity: string | null): BadgeTone {
  switch (severity) {
    case "CRITICAL":
      return "breach";
    case "HIGH":
      return "ember";
    case "MEDIUM":
      return "pulse";
    case "LOW":
    case "INFO":
      return "neutral";
    default:
      return "neutral";
  }
}

export function toneForKind(kind: string | null): BadgeTone {
  switch (kind) {
    case "BREAKING":
    case "INCIDENT":
      return "breach";
    case "DEPRECATION":
    case "SECURITY":
      return "ember";
    case "FEATURE":
      return "signal";
    case "MAINTENANCE":
    case "NOTICE":
      return "pulse";
    default:
      return "neutral";
  }
}
