import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/app/copy-button";

export const metadata: Metadata = { title: "Referrals" };

export default async function ReferralPage() {
  const user = await requireUser();
  const referrals = await db.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const link = appUrl(`/?ref=${user.referralCode}`);
  const converted = referrals.filter((referral) => referral.status !== "PENDING").length;

  return (
    <div className="animate-rise-in space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-fg">Referrals</h1>
        <p className="mt-1 text-sm text-fg-muted">
          When someone you refer goes Pro, you both get a month of Pro credited
          automatically. No forms, no waiting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <code className="datum flex-1 truncate rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm text-fg">
            {link}
          </code>
          <CopyButton value={link} label="Copy link" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity</CardTitle>
            <span className="datum text-xs text-fg-faint">
              {referrals.length} signups · {converted} converted
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-fg-muted">
              No referrals yet. The link above lands people on the homepage with
              your code attached — sharing an impact report does the same thing.
            </p>
          ) : (
            <ul className="space-y-2">
              {referrals.map((referral) => (
                <li
                  key={referral.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-ink-800 px-3 py-2"
                >
                  <span className="datum text-xs text-fg-muted">
                    {referral.createdAt.toISOString().slice(0, 10)}
                  </span>
                  <Badge
                    tone={
                      referral.status === "REWARDED"
                        ? "signal"
                        : referral.status === "CONVERTED"
                          ? "pulse"
                          : "neutral"
                    }
                  >
                    {referral.status === "REWARDED"
                      ? "credited"
                      : referral.status === "CONVERTED"
                        ? "converting"
                        : "signed up"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
