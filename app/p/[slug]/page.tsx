import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, toneForKind, toneForSeverity } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { formatRelative } from "@/lib/utils";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const providers = await db.provider.findMany({ select: { slug: true } });
    return providers.map((provider) => ({ slug: provider.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await db.provider.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (provider === null) return { title: "Provider not found" };
  return {
    title: `${provider.name} API changes, deprecations & incidents`,
    description: `Live tracked history of ${provider.name} API breaking changes, deprecations, and incidents — classified by severity, with deadlines. Watched continuously by Upstream.`,
    alternates: { canonical: `/p/${slug}` },
  };
}

/**
 * Public provider page — the SEO engine. Every provider in the registry gets
 * a continuously-updated public history of its API changes. These pages
 * answer the queries developers actually type ("stripe api breaking changes")
 * and every visitor arrives one click from signup.
 */
export default async function PublicProviderPage({ params }: PageProps) {
  const { slug } = await params;
  const provider = await db.provider.findUnique({
    where: { slug },
    include: {
      changes: {
        where: { status: "CLASSIFIED" },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: { select: { watches: true } },
    },
  });
  if (provider === null) notFound();

  const breakingCount = provider.changes.filter(
    (change) => change.kind === "BREAKING" || change.kind === "DEPRECATION"
  ).length;
  const lastBreaking = provider.changes.find((change) => change.kind === "BREAKING");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${provider.name} API change history`,
    description: `Tracked breaking changes, deprecations, and incidents for the ${provider.name} API.`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Upstream", item: process.env.NEXT_PUBLIC_APP_URL },
        { "@type": "ListItem", position: 2, name: provider.name, item: `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}` },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-ink-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" aria-label="Upstream home">
            <Logo />
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Watch {provider.name} — free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="datum text-xs uppercase tracking-widest text-fg-faint">
          {provider.category} · public change history
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-fg">
          {provider.name} API changes
        </h1>
        <p className="mt-3 max-w-xl text-fg-muted">
          Every change {provider.name} publishes — breaking changes,
          deprecations, incidents — monitored continuously and classified by
          severity. {provider._count.watches > 0
            ? `${provider._count.watches} developers get alerted the moment something lands here.`
            : "Get alerted the moment something lands here."}
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-ink-900 p-4 etch">
            <dt className="datum text-xs uppercase tracking-wider text-fg-faint">
              changes tracked
            </dt>
            <dd className="datum mt-1 text-xl font-semibold text-fg">
              {provider.changes.length}
            </dd>
          </div>
          <div className="rounded-xl border border-line bg-ink-900 p-4 etch">
            <dt className="datum text-xs uppercase tracking-wider text-fg-faint">
              breaking + deprecations
            </dt>
            <dd className="datum mt-1 text-xl font-semibold text-ember">{breakingCount}</dd>
          </div>
          <div className="rounded-xl border border-line bg-ink-900 p-4 etch">
            <dt className="datum text-xs uppercase tracking-wider text-fg-faint">
              last breaking change
            </dt>
            <dd className="datum mt-1 text-xl font-semibold text-fg">
              {lastBreaking !== undefined ? formatRelative(lastBreaking.createdAt) : "none tracked"}
            </dd>
          </div>
        </dl>

        <div className="mt-10 space-y-3">
          {provider.changes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-fg-muted">
              Monitoring is live — classified changes appear here as{" "}
              {provider.name} publishes them.
            </p>
          ) : (
            provider.changes.map((change) => (
              <article
                key={change.id}
                className="rounded-xl border border-line bg-ink-900 p-4 etch"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={toneForKind(change.kind)}>{change.kind ?? "NOTICE"}</Badge>
                  {change.severity !== null && change.severity !== "INFO" ? (
                    <Badge tone={toneForSeverity(change.severity)}>{change.severity}</Badge>
                  ) : null}
                  <span className="datum ml-auto text-xs text-fg-faint">
                    {formatRelative(change.createdAt)}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-sm font-semibold text-fg">
                  {change.url !== null ? (
                    <a
                      href={change.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-signal"
                    >
                      {change.title}
                    </a>
                  ) : (
                    change.title
                  )}
                </h2>
                {change.summary !== null ? (
                  <p className="mt-1.5 text-sm text-fg-muted">{change.summary}</p>
                ) : null}
              </article>
            ))
          )}
        </div>

        <div className="mt-12 rounded-xl border border-signal/25 bg-signal-faint p-6 text-center">
          <h2 className="font-display text-lg font-semibold text-fg">
            Reading this page after something broke?
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">
            Next time, hear about it the same half-hour it's published. Watch{" "}
            {provider.name} and the rest of your stack — free.
          </p>
          <Link href="/sign-up" className="mt-4 inline-block">
            <Button>Start watching</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
