import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import { Badge, toneForKind, toneForSeverity } from "@/components/ui/badge";
import { formatRelative, daysUntil } from "@/lib/utils";

export interface ChangeCardData {
  id: string;
  title: string;
  url: string | null;
  kind: string | null;
  severity: string | null;
  summary: string | null;
  actionRequired: string | null;
  affectedSurfaces: string[];
  effectiveAt: Date | null;
  createdAt: Date;
  status: string;
  providerName: string;
  providerSlug: string;
}

/**
 * One upstream event. The left rail encodes severity as color — the whole
 * feed reads like an instrument strip, scannable without reading.
 */
export function ChangeCard({ change }: { change: ChangeCardData }) {
  const severityTone = toneForSeverity(change.severity);
  const railColor =
    severityTone === "breach"
      ? "bg-breach"
      : severityTone === "ember"
        ? "bg-ember"
        : severityTone === "pulse"
          ? "bg-pulse"
          : "bg-line-strong";

  const deadlineDays =
    change.effectiveAt !== null ? daysUntil(change.effectiveAt) : null;

  return (
    <article className="relative animate-rise-in overflow-hidden rounded-xl border border-line bg-ink-900 etch">
      <div className={`absolute inset-y-0 left-0 w-0.5 ${railColor}`} aria-hidden="true" />
      <div className="p-4 pl-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/p/${change.providerSlug}`}
            className="datum text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {change.providerName}
          </Link>
          {change.kind !== null ? (
            <Badge tone={toneForKind(change.kind)}>{change.kind}</Badge>
          ) : (
            <Badge tone="neutral">analyzing</Badge>
          )}
          {change.severity !== null && change.severity !== "INFO" ? (
            <Badge tone={severityTone}>{change.severity}</Badge>
          ) : null}
          <span className="datum ml-auto text-xs text-fg-faint">
            {formatRelative(change.createdAt)}
          </span>
        </div>

        <h3 className="mt-2 font-display text-sm font-semibold leading-snug text-fg">
          {change.url !== null ? (
            <a
              href={change.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-1 transition-colors hover:text-signal"
            >
              {change.title}
              <ArrowUpRight size={13} className="mt-0.5 shrink-0 opacity-60" />
            </a>
          ) : (
            change.title
          )}
        </h3>

        {change.summary !== null ? (
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{change.summary}</p>
        ) : change.status === "PENDING" ? (
          <p className="mt-1.5 text-sm italic text-fg-faint">
            Classification in progress — the raw entry is linked above.
          </p>
        ) : null}

        {change.actionRequired !== null ? (
          <p className="mt-2 rounded-lg border border-ember/20 bg-ember-faint p-2.5 text-sm text-fg">
            <span className="font-semibold text-ember">Action: </span>
            {change.actionRequired}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {change.affectedSurfaces.map((surface) => (
            <span key={surface} className="datum text-xs text-fg-faint">
              {surface}
            </span>
          ))}
          {deadlineDays !== null && deadlineDays > 0 ? (
            <span className="datum ml-auto inline-flex items-center gap-1 text-xs font-medium text-ember">
              <CalendarClock size={12} />
              {deadlineDays} days until deadline
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
