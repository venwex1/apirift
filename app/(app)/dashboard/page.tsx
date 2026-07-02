import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/app/empty-state";
import { ChangeCard, type ChangeCardData } from "@/components/app/change-card";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Signal" };

export default async function DashboardPage() {
  const user = await requireUser();

  const watches = await db.watch.findMany({
    where: { userId: user.id },
    include: {
      provider: {
        include: {
          changes: {
            where: { status: "CLASSIFIED" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { severity: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (watches.length === 0) {
    return (
      <div className="animate-rise-in">
        <h1 className="font-display text-xl font-semibold text-fg">Signal</h1>
        <p className="mt-1 text-sm text-fg-muted">
          The live feed of everything changing underneath your product.
        </p>
        <div className="mt-8">
          <EmptyState
            title="Nothing is being watched yet"
            description="Add the APIs your product depends on — or paste your package.json and let the registry find them for you."
            action={
              <div className="flex gap-3">
                <Link href="/impact">
                  <Button>Paste package.json</Button>
                </Link>
                <Link href="/providers">
                  <Button variant="secondary">Browse registry</Button>
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const providerIds = watches.map((watch) => watch.providerId);
  const recentChanges = await db.change.findMany({
    where: {
      providerId: { in: providerIds },
      OR: [{ status: "CLASSIFIED" }, { status: "PENDING" }],
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { provider: { select: { name: true, slug: true } } },
  });

  const changeCards: ChangeCardData[] = recentChanges.map((change) => ({
    id: change.id,
    title: change.title,
    url: change.url,
    kind: change.kind,
    severity: change.severity,
    summary: change.summary,
    actionRequired: change.actionRequired,
    affectedSurfaces: change.affectedSurfaces,
    effectiveAt: change.effectiveAt,
    createdAt: change.createdAt,
    status: change.status,
    providerName: change.provider.name,
    providerSlug: change.provider.slug,
  }));

  const limit = PLAN_LIMITS[user.plan].maxWatches;
  const hasCritical = changeCards.some(
    (change) => change.severity === "CRITICAL" || change.severity === "HIGH"
  );

  return (
    <div className="animate-rise-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg">Signal</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {hasCritical
              ? "Attention needed — high-severity changes in your stack."
              : "All quiet. Your stack has no urgent changes."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${hasCritical ? "bg-ember" : "animate-pulse-dot bg-signal"}`}
            aria-hidden="true"
          />
          <span className="datum text-xs text-fg-muted">
            {hasCritical ? "action needed" : "all clear"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {watches.map((watch) => {
          const latest = watch.provider.changes[0];
          const tone =
            latest?.severity === "CRITICAL"
              ? "bg-breach"
              : latest?.severity === "HIGH"
                ? "bg-ember"
                : "bg-signal";
          return (
            <Link key={watch.id} href={`/providers/${watch.provider.slug}`}>
              <Card className="transition-colors duration-200 ease-needle hover:border-line-strong">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden="true" />
                    <span className="truncate font-display text-sm font-medium text-fg">
                      {watch.provider.name}
                    </span>
                  </div>
                  <p className="datum mt-1.5 text-xs text-fg-faint">
                    {latest !== undefined
                      ? `last change ${formatRelative(latest.createdAt)}`
                      : "no changes recorded"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {Number.isFinite(limit) ? (
          <Link href="/providers">
            <Card className="border-dashed transition-colors duration-200 ease-needle hover:border-line-strong">
              <CardContent className="flex h-full items-center justify-center p-3.5">
                <span className="datum text-xs text-fg-muted">
                  {watches.length}/{limit} watched — add more
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </div>

      <h2 className="mt-10 font-display text-sm font-semibold uppercase tracking-wider text-fg-muted">
        Last 30 days across your stack
      </h2>
      <div className="mt-3 space-y-3">
        {changeCards.length === 0 ? (
          <EmptyState
            title="A quiet month upstream"
            description="No changes recorded for your watched providers in the last 30 days. That's the good kind of silence — and you'll know the second it ends."
          />
        ) : (
          changeCards.map((change) => <ChangeCard key={change.id} change={change} />)
        )}
      </div>
    </div>
  );
}
