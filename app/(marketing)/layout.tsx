import type { ReactNode } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="Upstream home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <Link
              href="/pricing"
              className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Blog
            </Link>
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
              >
                Sign in
              </Link>
              <Link href="/sign-up" className="ml-2">
                <Button size="sm">Watch your stack</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="ml-2">
                <Button size="sm" variant="secondary">
                  Dashboard
                </Button>
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-fg-muted">
                Know before it breaks. Autonomous monitoring for every API your
                product depends on.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h3 className="datum text-xs font-semibold uppercase tracking-widest text-fg-faint">
                  Product
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/pricing" className="text-fg-muted transition-colors hover:text-fg">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-fg-muted transition-colors hover:text-fg">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="text-fg-muted transition-colors hover:text-fg">
                      Get started
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="datum text-xs font-semibold uppercase tracking-widest text-fg-faint">
                  Watched providers
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/p/stripe" className="text-fg-muted transition-colors hover:text-fg">
                      Stripe changes
                    </Link>
                  </li>
                  <li>
                    <Link href="/p/openai" className="text-fg-muted transition-colors hover:text-fg">
                      OpenAI changes
                    </Link>
                  </li>
                  <li>
                    <Link href="/p/vercel" className="text-fg-muted transition-colors hover:text-fg">
                      Vercel changes
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="datum mt-10 text-xs text-fg-faint">
            © {new Date().getFullYear()} Upstream. Built on APIs that change
            without asking — we'd know.
          </p>
        </div>
      </footer>
    </div>
  );
}
