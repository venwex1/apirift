import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ink-900/50 px-6 py-16 text-center">
      <div className="relative mb-4 h-2 w-32 overflow-hidden rounded-full bg-ink-800">
        <div className="absolute inset-y-0 w-8 animate-scanline rounded-full bg-signal/40" />
      </div>
      <h2 className="font-display text-base font-semibold text-fg">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      {action !== undefined ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
