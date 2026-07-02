"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoEvent {
  provider: string;
  kind: "BREAKING" | "DEPRECATION" | "INCIDENT" | "FEATURE";
  text: string;
  detail: string;
}

const EVENTS: DemoEvent[] = [
  {
    provider: "Stripe",
    kind: "DEPRECATION",
    text: "Legacy webhook signature scheme sunsets in 41 days",
    detail: "You verify signatures in 2 endpoints → migrate to v2 scheme",
  },
  {
    provider: "OpenAI",
    kind: "BREAKING",
    text: "Default tokenizer changed for fine-tuned models",
    detail: "Affects completions API → pin tokenizer version before deploy",
  },
  {
    provider: "Vercel",
    kind: "INCIDENT",
    text: "Elevated function cold-start latency in iad1",
    detail: "Your region → no action, monitoring recovery",
  },
  {
    provider: "Clerk",
    kind: "FEATURE",
    text: "Session token size reduced 40%",
    detail: "No action — smaller cookies on your next deploy",
  },
  {
    provider: "Resend",
    kind: "DEPRECATION",
    text: "API v1 endpoints deprecated, removal in 90 days",
    detail: "You call /v1/send in one worker → bump SDK to 4.x",
  },
];

const KIND_COLOR: Record<DemoEvent["kind"], string> = {
  BREAKING: "text-breach border-breach/25 bg-breach-faint",
  DEPRECATION: "text-ember border-ember/25 bg-ember-faint",
  INCIDENT: "text-breach border-breach/25 bg-breach-faint",
  FEATURE: "text-signal border-signal/25 bg-signal-faint",
};

/**
 * The hero instrument: a live-feeling feed of upstream events cycling
 * through realistic examples. Communicates the product in one glance —
 * things change out there; here is where you find out.
 */
export function SignalDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % EVENTS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const visible = [0, 1, 2].map(
    (offset) => EVENTS[(index + offset) % EVENTS.length]
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-line bg-ink-900 p-4 etch"
      aria-label="Example feed of upstream changes"
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="datum text-xs uppercase tracking-widest text-fg-faint">
          your stack · live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-signal" />
          <span className="datum text-xs text-signal">watching</span>
        </span>
      </div>
      <div className="mt-3 space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((event) =>
            event === undefined ? null : (
              <motion.div
                key={`${event.provider}-${event.text}`}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-lg border border-line bg-ink-800 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="datum text-xs font-medium text-fg-muted">
                    {event.provider}
                  </span>
                  <span
                    className={`datum rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_COLOR[event.kind]}`}
                  >
                    {event.kind}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-fg">{event.text}</p>
                <p className="datum mt-1 text-xs text-fg-faint">{event.detail}</p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink-900 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
