import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { WatchButton } from "@/components/app/watch-button";
import Link from "next/link";

export const metadata: Metadata = { title: "Registry" };

export default async function ProvidersPage() {
  const user = await requireUser();
  const [providers, watches] = await Promise.all([
    db.provider.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { _count: { select: { watches: true, changes: true } } },
    }),
    db.watch.findMany({ where: { userId: user.id }, select: { providerId: true } }),
  ]);

  const watchedIds = new Set(watches.map((watch) => watch.providerId));
  const limit = PLAN_LIMITS[user.plan].maxWatches;
  const categories = [...new Set(providers.map((provider) => provider.category))];

  return (
    <div className="animate-rise-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg">Registry</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Every provider Upstream monitors. Watch the ones your product is built on.
          </p>
        </div>
        <span className="datum text-xs text-fg-faint">
          {watches.length}
          {Number.isFinite(limit) ? `/${limit}` : ""} watched
        </span>
      </div>

      {categories.map((category) => (
        <section key={category} className="mt-8">
          <h2 className="datum text-xs font-semibold uppercase tracking-widest text-fg-faint">
            {category}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {providers
              .filter((provider) => provider.category === category)
              .map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link
                        href={`/providers/${provider.slug}`}
                        className="font-display text-sm font-semibold text-fg transition-colors hover:text-signal"
                      >
                        {provider.name}
                      </Link>
                      <p className="datum mt-0.5 truncate text-xs text-fg-faint">
                        {provider._count.changes} changes tracked ·{" "}
                        {provider._count.watches} watching
                      </p>
                    </div>
                    <WatchButton
                      providerSlug={provider.slug}
                      watching={watchedIds.has(provider.id)}
                    />
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      ))}

      <p className="mt-10 rounded-xl border border-line bg-ink-900 p-4 text-sm text-fg-muted">
        Missing a provider you depend on? Reply to any Upstream email with the
        name and changelog URL — additions ship to every user at once.
      </p>
    </div>
  );
}
