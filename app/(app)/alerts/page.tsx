import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChangeCard, type ChangeCardData } from "@/components/app/change-card";
import { EmptyState } from "@/components/app/empty-state";
import { MarkAllRead } from "@/components/app/mark-all-read";

export const metadata: Metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const user = await requireUser();
  const alerts = await db.alert.findMany({
    where: { userId: user.id, channel: "EMAIL" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      change: { include: { provider: { select: { name: true, slug: true } } } },
    },
  });

  const unreadIds = alerts
    .filter((alert) => alert.readAt === null)
    .map((alert) => alert.id);

  return (
    <div className="animate-rise-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg">Alerts</h1>
          <p className="mt-1 text-sm text-fg-muted">
            High-severity changes that were sent to your inbox.
          </p>
        </div>
        {unreadIds.length > 0 ? <MarkAllRead alertIds={unreadIds} /> : null}
      </div>

      <div className="mt-6 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState
            title="No alerts yet"
            description={
              user.plan === "FREE"
                ? "Free plans get the weekly digest. Instant alerts for critical and high-severity changes are a Pro feature."
                : "When a critical or high-severity change lands in your stack, it shows up here and in your inbox within minutes."
            }
          />
        ) : (
          alerts.map((alert) => {
            const change: ChangeCardData = {
              id: alert.change.id,
              title: alert.change.title,
              url: alert.change.url,
              kind: alert.change.kind,
              severity: alert.change.severity,
              summary: alert.change.summary,
              actionRequired: alert.change.actionRequired,
              affectedSurfaces: alert.change.affectedSurfaces,
              effectiveAt: alert.change.effectiveAt,
              createdAt: alert.createdAt,
              status: alert.change.status,
              providerName: alert.change.provider.name,
              providerSlug: alert.change.provider.slug,
            };
            return (
              <div key={alert.id} className={alert.readAt === null ? "" : "opacity-60"}>
                <ChangeCard change={change} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
