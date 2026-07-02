"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllRead({ alertIds }: { alertIds: string[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markRead(): Promise<void> {
    setPending(true);
    try {
      const res = await fetch("/api/alerts/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alertIds }),
      });
      if (res.ok) router.refresh();
    } catch {
      // Non-critical: leave unread state as-is.
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => void markRead()} disabled={pending}>
      {pending ? "Marking…" : `Mark ${alertIds.length} read`}
    </Button>
  );
}
