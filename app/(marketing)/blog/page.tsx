import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Field notes on dependency risk, API deprecations, and building software that survives other people's changes.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-fg">Field notes</h1>
      <p className="mt-2 text-fg-muted">
        On dependency risk, API deprecations, and building software that
        survives other people's changes.
      </p>
      <ul className="mt-10 divide-y divide-line">
        {posts.map((post) => (
          <li key={post.slug} className="py-6">
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-fg transition-colors group-hover:text-signal">
                  {post.title}
                </h2>
                <span className="datum shrink-0 text-xs text-fg-faint">
                  {post.date} · {post.readingMinutes} min
                </span>
              </div>
              <p className="mt-2 text-sm text-fg-muted">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
