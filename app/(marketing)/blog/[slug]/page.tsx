import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (post === null) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (post === null) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Upstream" },
    publisher: { "@type": "Organization", name: "Upstream" },
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="datum text-xs uppercase tracking-widest text-fg-faint">
        {post.date} · {post.readingMinutes} min read
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-fg">
        {post.title}
      </h1>
      <div className="prose-upstream mt-8">
        <MDXRemote source={post.content} />
      </div>
      <div className="mt-16 rounded-xl border border-signal/25 bg-signal-faint p-6 text-center">
        <h2 className="font-display text-lg font-semibold text-fg">
          Your stack changes weekly. Your awareness shouldn't depend on luck.
        </h2>
        <Link href="/sign-up" className="mt-4 inline-block">
          <Button>Watch your stack — free</Button>
        </Link>
      </div>
    </article>
  );
}
