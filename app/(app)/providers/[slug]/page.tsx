import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChangeCard, type ChangeCardData } from "@/components/app/change-card";
import { WatchButton } from "@/components/app/watch-button";
import { EmptyState } from "@/components/app/empty-state";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await db.provider.findUnique({ where: { slug }, select: { name: true } });
  return { title: provider !== null ? `${provider.name} — changes` : "Provider" };
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await requireUser();

  const provider = await db.provider.findUnique({
    where: { slug },
    include: {
      changes: {
        where: { OR: [{ status: "CLASSIFIED" }, { status: "PENDING" }] },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { watches: true } },
    },
  });
  if (provider === null) notFound();

  const watching = await db.watch.findFirst({
    where: { userId: user.id, providerId: provider.id },
    select: { id: true },
  });

  const changeCards: ChangeCardData[] = provider.changes.map((change) => ({
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
    providerName: provider.name,
    providerSlug: provider.slug,
  }));

  return (
    <div className="animate-rise-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg">{provider.name}</h1>
          <p className="datum mt-1 text-xs text-fg-faint">
            {provider.category} · {provider._count.watches} developers watching ·{" "}
            <a
              href={provider.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-muted transition-colors hover:text-signal"
            >
              {new URL(provider.homepage).hostname}
            </a>
          </p>
        </div>
        <WatchButton providerSlug={provider.slug} watching={watching !== null} />
      </div>

      <div className="mt-8 space-y-3">
        {changeCards.length === 0 ? (
          <EmptyState
            title="No changes recorded yet"
            description="Monitoring is live — entries appear here within 30 minutes of the provider publishing them."
          />
        ) : (
          changeCards.map((change) => <ChangeCard key={change.id} change={change} />)
        )}
      </div>
    </div>
  );
}
