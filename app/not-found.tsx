import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="datum text-xs uppercase tracking-widest text-fg-faint">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-fg">
        This page moved without a deprecation notice
      </h1>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        Ironic, we know. The page you're looking for doesn't exist here.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to upstream.watch</Button>
      </Link>
    </div>
  );
}
