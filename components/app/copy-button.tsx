"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions); select-and-copy still works.
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => void copy()}>
      {copied ? <Check size={14} className="text-signal" /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </Button>
  );
}
