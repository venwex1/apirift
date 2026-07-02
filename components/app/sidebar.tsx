"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Activity,
  Radar,
  FileSearch,
  Bell,
  Gift,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";

const links = [
  { href: "/dashboard", label: "Signal", icon: Activity },
  { href: "/providers", label: "Registry", icon: Radar },
  { href: "/impact", label: "Impact", icon: FileSearch },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/referral", label: "Referrals", icon: Gift },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ unreadAlerts }: { unreadAlerts: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-56 shrink-0 flex-col border-r border-line bg-ink-900"
    >
      <div className="flex h-14 items-center border-b border-line px-4">
        <Link href="/dashboard" aria-label="Upstream dashboard">
          <Logo />
        </Link>
      </div>
      <ul className="flex-1 space-y-0.5 p-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ease-needle",
                  active
                    ? "bg-ink-800 font-medium text-fg"
                    : "text-fg-muted hover:bg-ink-800/60 hover:text-fg"
                )}
              >
                <Icon size={15} className={active ? "text-signal" : undefined} />
                {label}
                {href === "/alerts" && unreadAlerts > 0 ? (
                  <span className="datum ml-auto rounded bg-signal-faint px-1.5 text-xs font-semibold text-signal">
                    {unreadAlerts > 99 ? "99+" : unreadAlerts}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line p-3">
        <UserButton
          appearance={{ elements: { userButtonBox: "flex-row-reverse" } }}
          showName
        />
      </div>
    </nav>
  );
}
