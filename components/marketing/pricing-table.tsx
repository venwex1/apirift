import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_PRICES } from "@/lib/plans";

interface Tier {
  name: string;
  price: string;
  priceDetail: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    priceDetail: "forever",
    description: "For the side project you still care about.",
    features: [
      "Watch 5 providers",
      "Weekly digest every Monday",
      "2 impact reports per month",
      "Full change history access",
    ],
    cta: "Start watching",
    highlighted: false,
  },
  {
    name: "Pro",
    price: `$${PLAN_PRICES.PRO.monthly}`,
    priceDetail: `per month · $${PLAN_PRICES.PRO.yearly}/yr (save 20%)`,
    description: "For the product that pays your rent.",
    features: [
      "Unlimited providers",
      "Instant alerts — minutes, not Mondays",
      "50 impact reports per month",
      "Deprecation deadline countdowns",
      "Remove Upstream badge from shared reports",
      "5 projects",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: `$${PLAN_PRICES.TEAM.monthly}`,
    priceDetail: `per month · $${PLAN_PRICES.TEAM.yearly}/yr (save 20%)`,
    description: "For the team that ships every week.",
    features: [
      "Everything in Pro",
      "Outgoing webhooks to your own systems",
      "25 projects",
      "500 impact reports per month",
      "Priority classification queue",
    ],
    cta: "Start with Team",
    highlighted: false,
  },
];

export function PricingTable() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`flex flex-col rounded-xl border p-6 etch ${
            tier.highlighted
              ? "border-signal/40 bg-ink-900 shadow-[0_0_40px_rgba(46,230,168,0.06)]"
              : "border-line bg-ink-900"
          }`}
        >
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-semibold text-fg">{tier.name}</h3>
            {tier.highlighted ? (
              <span className="datum rounded border border-signal/25 bg-signal-faint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal">
                most chosen
              </span>
            ) : null}
          </div>
          <p className="mt-4">
            <span className="datum text-3xl font-semibold text-fg">{tier.price}</span>
          </p>
          <p className="datum mt-1 text-xs text-fg-faint">{tier.priceDetail}</p>
          <p className="mt-3 text-sm text-fg-muted">{tier.description}</p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-fg-muted">
                <Check size={15} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className="mt-6">
            <Button
              variant={tier.highlighted ? "primary" : "secondary"}
              className="w-full"
            >
              {tier.cta}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
