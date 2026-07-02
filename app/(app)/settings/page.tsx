import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PLAN_LIMITS, PLAN_PRICES } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortalButton } from "@/components/app/portal-button";
import { UpgradeCta } from "@/components/app/upgrade-cta";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const limits = PLAN_LIMITS[user.plan];

  return (
    <div className="animate-rise-in space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-fg">Settings</h1>
        <p className="mt-1 text-sm text-fg-muted">Account, plan, and billing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-fg">{user.email}</p>
          <p className="datum text-xs text-fg-faint">
            member since {user.createdAt.toISOString().slice(0, 10)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan</CardTitle>
            <Badge tone={user.plan === "FREE" ? "neutral" : "signal"}>{user.plan}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1.5 text-sm text-fg-muted">
            <li>
              Providers watched:{" "}
              <span className="datum text-fg">
                {Number.isFinite(limits.maxWatches) ? limits.maxWatches : "unlimited"}
              </span>
            </li>
            <li>
              Impact reports:{" "}
              <span className="datum text-fg">{limits.impactReportsPerMonth}/month</span>
            </li>
            <li>
              Alerting:{" "}
              <span className="datum text-fg">
                {limits.instantAlerts ? "instant email" : "weekly digest"}
              </span>
            </li>
            <li>
              Outgoing webhooks:{" "}
              <span className="datum text-fg">{limits.webhooks ? "enabled" : "Team plan"}</span>
            </li>
          </ul>
          {user.cancelAtPeriodEnd && user.planRenewsAt !== null ? (
            <p className="rounded-lg border border-ember/20 bg-ember-faint p-3 text-sm text-fg">
              Your plan ends {user.planRenewsAt.toISOString().slice(0, 10)}. You keep
              all paid features until then.
            </p>
          ) : null}
          <div className="flex gap-3">
            {user.plan === "FREE" ? (
              <UpgradeCta
                reason={`Pro is $${PLAN_PRICES.PRO.monthly}/month — unlimited providers, instant alerts, 50 impact reports.`}
              />
            ) : (
              <PortalButton />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fg-muted">
            Your watches, projects, and reports are backed up weekly to
            independent storage. To export or delete your account data, reply
            to any Upstream email — deletion completes within 7 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
