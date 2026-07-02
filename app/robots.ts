import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://upstream.watch";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/settings", "/alerts", "/impact", "/referral", "/api/", "/r/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
