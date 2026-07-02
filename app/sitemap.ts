import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://upstream.watch";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const posts = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  let providerPages: MetadataRoute.Sitemap = [];
  try {
    const providers = await db.provider.findMany({
      select: { slug: true, updatedAt: true },
    });
    providerPages = providers.map((provider) => ({
      url: `${base}/p/${provider.slug}`,
      lastModified: provider.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9, // these pages ARE the SEO engine
    }));
  } catch {
    // DB unavailable at build: ship the static portion.
  }

  return [...staticPages, ...posts, ...providerPages];
}
