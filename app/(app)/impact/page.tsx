import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMonthlyUsage } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/plans";
import { ImpactForm } from "@/components/app/impact-form";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Impact" };

export default async function ImpactPage() {
  const user = await requireUser();
  const [used, reports] = await Promise.all([
    getMonthlyUsage(user.id, "impact_reports"),
    db.impactReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, publicId: true, matchedProviders: true, createdAt: true },
    }),
  ]);
  const limit = PLAN_LIMITS[user.plan].impactReportsPerMonth;

  return (
    <div className="animate-rise-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg">Impact analysis</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Paste a package.json — get every recent breaking change, deprecation,
            and incident across the APIs you actually use.
          </p>
        </div>
        <span className="datum text-xs text-fg-faint">
          {used}/{limit} this month
        </span>
      </div>

      <div className="mt-6">
        <ImpactForm />
      </div>

      {reports.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Previous reports
          </h2>
          <ul className="mt-3 space-y-2">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/r/${report.publicId}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-ink-900 px-4 py-3 transition-colors duration-200 ease-needle hover:border-line-strong"
                >
                  <span className="text-sm text-fg">
                    {report.matchedProviders.length} providers matched
                  </span>
                  <span className="datum text-xs text-fg-faint">
                    {formatRelative(report.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
