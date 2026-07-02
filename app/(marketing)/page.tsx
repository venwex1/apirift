import Link from "next/link";
import type { Metadata } from "next";
import { Radar, Zap, FileSearch, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { cached } from "@/lib/redis";
import { Button } from "@/components/ui/button";
import { SignalDemo } from "@/components/marketing/signal-demo";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Faq } from "@/components/marketing/faq";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Upstream — Know before it breaks",
  description:
    "Your product is built on APIs that change without asking. Upstream reads every changelog, status page, and deprecation notice in your stack — and tells you what will break you, before it does.",
  alternates: { canonical: "/" },
};

interface RegistryStats {
  providers: number;
  changes: number;
  breaking: number;
}

async function getStats(): Promise<RegistryStats> {
  try {
    return await cached<RegistryStats>("stats:landing", 3600, async () => {
      const [providers, changes, breaking] = await Promise.all([
        db.provider.count(),
        db.change.count(),
        db.change.count({ where: { kind: { in: ["BREAKING", "DEPRECATION"] } } }),
      ]);
      return { providers, changes, breaking };
    });
  } catch {
    // Static fallback keeps the landing page rendering even if the DB naps.
    return { providers: 24, changes: 0, breaking: 0 };
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Upstream",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://upstream.watch",
    },
    {
      "@type": "Organization",
      name: "Upstream",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://upstream.watch",
      description:
        "Autonomous monitoring for every API your product depends on.",
    },
    {
      "@type": "SoftwareApplication",
      name: "Upstream",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Beat 1 — under 3 seconds: what this is. */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden"
          aria-hidden="true"
        >
          <div className="h-px w-40 animate-scanline bg-gradient-to-r from-transparent via-signal to-transparent" />
        </div>
        <div className="mx-auto grid max-w-5xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:pt-24">
          <div>
            <p className="datum text-xs uppercase tracking-widest text-signal">
              autonomous dependency intelligence
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-fg sm:text-5xl">
              Know before it breaks.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-fg-muted">
              Your product is built on APIs that change without asking.
              Upstream reads every changelog, status page, and deprecation
              notice in your stack — and tells you what will break you, before
              it does.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/sign-up">
                <Button size="lg">Watch your stack — free</Button>
              </Link>
              <span className="datum text-xs text-fg-faint">
                no card · 60-second setup
              </span>
            </div>
            <dl className="mt-10 flex gap-8">
              <div>
                <dt className="datum text-xs uppercase tracking-wider text-fg-faint">
                  providers watched
                </dt>
                <dd className="datum mt-1 text-2xl font-semibold text-fg">
                  {stats.providers}
                </dd>
              </div>
              {stats.changes > 0 ? (
                <div>
                  <dt className="datum text-xs uppercase tracking-wider text-fg-faint">
                    changes tracked
                  </dt>
                  <dd className="datum mt-1 text-2xl font-semibold text-fg">
                    {stats.changes.toLocaleString()}
                  </dd>
                </div>
              ) : null}
              {stats.breaking > 0 ? (
                <div>
                  <dt className="datum text-xs uppercase tracking-wider text-fg-faint">
                    breakage caught
                  </dt>
                  <dd className="datum mt-1 text-2xl font-semibold text-ember">
                    {stats.breaking.toLocaleString()}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
          <SignalDemo />
        </div>
      </section>

      {/* Beat 2 — under 30 seconds: this product understands MY problem. */}
      <section className="border-t border-line bg-ink-900/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="max-w-2xl font-display text-2xl font-semibold text-fg sm:text-3xl">
            The bug that takes down your product was merged by someone you've
            never met.
          </h2>
          <p className="mt-4 max-w-2xl text-fg-muted">
            Modern products are mostly other people's APIs. Stripe changes a
            webhook scheme. OpenAI retires a model. An SDK you depend on ships
            a breaking major. None of it is your code — all of it is your
            outage. Big companies have platform teams reading changelogs.
            You have production errors and angry users.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-ink-900 p-5 etch">
              <Radar className="text-signal" size={20} aria-hidden="true" />
              <h3 className="mt-3 font-display text-sm font-semibold text-fg">
                Declare your stack once
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                Paste a package.json or pick from the registry. Sixty seconds,
                and every API you depend on is under watch.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink-900 p-5 etch">
              <Zap className="text-signal" size={20} aria-hidden="true" />
              <h3 className="mt-3 font-display text-sm font-semibold text-fg">
                We read everything
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                Changelogs, status feeds, deprecation notices — polled every 30
                minutes, classified by severity and the exact surface affected.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink-900 p-5 etch">
              <FileSearch className="text-signal" size={20} aria-hidden="true" />
              <h3 className="mt-3 font-display text-sm font-semibold text-fg">
                You hear only what matters
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                A breaking change in an API you use is an alert in minutes. A
                feature announcement is a line in Monday's digest. Noise dies here.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink-900 p-5 etch">
              <ShieldCheck className="text-signal" size={20} aria-hidden="true" />
              <h3 className="mt-3 font-display text-sm font-semibold text-fg">
                Deadlines become calendar math
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                Every deprecation with a date becomes a countdown against your
                stack. "Sunsets March 1" turns into "41 days, 2 endpoints, here's what to do."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beat 3 — under 3 minutes: best solution I've seen. */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-2xl font-semibold text-fg">
            Why this doesn't exist inside your team already
          </h2>
          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div className="space-y-4 text-fg-muted">
              <p>
                Reading forty changelogs a week against your specific
                integration surface is a full-time job nobody does. It was
                never worth a human — and until language models got cheap
                enough to read everything, it couldn't be software either.
              </p>
              <p>
                Upstream's registry is shared infrastructure: Stripe gets
                watched once, for everyone. Every provider added, every change
                classified, every breakage confirmed makes the system smarter
                for every user at once. A competitor starting today starts
                with an empty history.
              </p>
              <p className="text-fg">
                And it runs itself. Polling, classification, alerting,
                digests — all autonomous. The product you rely on to never
                sleep doesn't.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink-900 p-5 etch">
              <p className="datum text-xs uppercase tracking-widest text-fg-faint">
                what an alert looks like
              </p>
              <div className="mt-3 rounded-lg border border-ember/25 bg-ember-faint p-4">
                <p className="datum text-xs font-semibold uppercase tracking-wider text-ember">
                  HIGH · DEPRECATION · Stripe
                </p>
                <p className="mt-2 font-display text-sm font-semibold text-fg">
                  Legacy webhook signature scheme sunsets 2026-08-12
                </p>
                <p className="mt-1.5 text-sm text-fg-muted">
                  Endpoints verifying with the v1 scheme stop validating after
                  the sunset. Migrate to the v2 signing secret before the date.
                </p>
                <p className="datum mt-3 text-xs text-fg-faint">
                  affects: webhook signatures · deadline in 41 days
                </p>
              </div>
              <p className="mt-4 text-sm text-fg-muted">
                Specific surface. Specific deadline. Specific action. Sent the
                same half-hour it was published — not discovered in a
                post-mortem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-line bg-ink-900/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center font-display text-2xl font-semibold text-fg">
            Free to watch. Pro to never be surprised.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-fg-muted">
            Free covers a side project. Pro covers a business. Both cancel in
            two clicks — no email asking why.
          </p>
          <div className="mt-10">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* FAQ + Beat 4: sign up or save the page. */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="font-display text-2xl font-semibold text-fg">
            Questions you'd ask
          </h2>
          <div className="mt-8">
            <Faq />
          </div>
          <div className="mt-16 rounded-xl border border-signal/25 bg-signal-faint p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-fg">
              The next breaking change is already scheduled.
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
              Somewhere in your stack, a sunset date is on someone's roadmap.
              The only question is whether you find out now or in production.
            </p>
            <Link href="/sign-up" className="mt-6 inline-block">
              <Button size="lg">Watch your stack — free</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
