import type { Metadata } from "next";
import Link from "next/link";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Faq } from "@/components/marketing/faq";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free to watch 5 providers with a weekly digest. Pro at $12/month for unlimited providers and instant alerts. No sales calls, cancel anytime.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-center font-display text-3xl font-semibold text-fg">
        One outage costs more than a decade of Pro.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-fg-muted">
        Pricing that respects how solo founders and small teams actually buy:
        try it free, upgrade when it earns it, cancel without friction.
      </p>
      <div className="mt-12">
        <PricingTable />
      </div>
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="font-display text-xl font-semibold text-fg">
          Pricing questions
        </h2>
        <div className="mt-6">
          <Faq />
        </div>
        <div className="mt-12 text-center">
          <Link href="/sign-up">
            <Button size="lg">Watch your stack — free</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
