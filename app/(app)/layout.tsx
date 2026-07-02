import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/app/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const unreadAlerts = await db.alert.count({
    where: { userId: user.id, readAt: null, channel: "EMAIL" },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar unreadAlerts={unreadAlerts} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
