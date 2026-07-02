"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/app/upgrade-modal";

export function UpgradeCta({ reason }: { reason: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Upgrade to Pro</Button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} reason={reason} />
    </>
  );
}
