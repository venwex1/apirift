import { PrismaClient, SourceType } from "@prisma/client";

/**
 * Seeds the provider registry: the 24 APIs most modern products are built on,
 * each with its real changelog/status feed. This registry is shared
 * infrastructure — monitoring Stripe once serves every user who watches
 * Stripe — and it grows from here.
 */
const prisma = new PrismaClient();

interface SeedSource {
  type: SourceType;
  url: string;
}

interface SeedProvider {
  slug: string;
  name: string;
  category: string;
  homepage: string;
  docsUrl: string;
  npmPackages: string[];
  sources: SeedSource[];
}

const providers: SeedProvider[] = [
  {
    slug: "stripe",
    name: "Stripe",
    category: "payments",
    homepage: "https://stripe.com",
    docsUrl: "https://docs.stripe.com",
    npmPackages: ["stripe", "@stripe/stripe-js", "@stripe/react-stripe-js"],
    sources: [
      { type: SourceType.HTML, url: "https://docs.stripe.com/changelog" },
      { type: SourceType.RSS, url: "https://www.stripestatus.com/history.rss" },
    ],
  },
  {
    slug: "openai",
    name: "OpenAI",
    category: "ai",
    homepage: "https://openai.com",
    docsUrl: "https://platform.openai.com/docs",
    npmPackages: ["openai"],
    sources: [
      { type: SourceType.HTML, url: "https://platform.openai.com/docs/changelog" },
      { type: SourceType.RSS, url: "https://status.openai.com/history.rss" },
    ],
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    category: "ai",
    homepage: "https://www.anthropic.com",
    docsUrl: "https://docs.claude.com",
    npmPackages: ["@anthropic-ai/sdk"],
    sources: [
      { type: SourceType.HTML, url: "https://docs.claude.com/en/release-notes/api" },
      { type: SourceType.RSS, url: "https://status.anthropic.com/history.rss" },
    ],
  },
  {
    slug: "vercel",
    name: "Vercel",
    category: "infra",
    homepage: "https://vercel.com",
    docsUrl: "https://vercel.com/docs",
    npmPackages: ["vercel", "@vercel/analytics", "@vercel/og"],
    sources: [
      { type: SourceType.RSS, url: "https://vercel.com/atom" },
      { type: SourceType.RSS, url: "https://www.vercel-status.com/history.rss" },
    ],
  },
  {
    slug: "github",
    name: "GitHub API",
    category: "devtools",
    homepage: "https://github.com",
    docsUrl: "https://docs.github.com/rest",
    npmPackages: ["@octokit/rest", "octokit", "@octokit/core"],
    sources: [
      { type: SourceType.RSS, url: "https://github.blog/changelog/feed/" },
      { type: SourceType.RSS, url: "https://www.githubstatus.com/history.rss" },
    ],
  },
  {
    slug: "clerk",
    name: "Clerk",
    category: "auth",
    homepage: "https://clerk.com",
    docsUrl: "https://clerk.com/docs",
    npmPackages: ["@clerk/nextjs", "@clerk/clerk-react", "@clerk/backend"],
    sources: [
      { type: SourceType.HTML, url: "https://clerk.com/changelog" },
      { type: SourceType.RSS, url: "https://status.clerk.com/history.rss" },
    ],
  },
  {
    slug: "auth0",
    name: "Auth0",
    category: "auth",
    homepage: "https://auth0.com",
    docsUrl: "https://auth0.com/docs",
    npmPackages: ["auth0", "@auth0/nextjs-auth0", "@auth0/auth0-react"],
    sources: [
      { type: SourceType.RSS, url: "https://auth0.com/changelog/rss.xml" },
      { type: SourceType.RSS, url: "https://status.auth0.com/feed?domain=up.auth0.com" },
    ],
  },
  {
    slug: "resend",
    name: "Resend",
    category: "email",
    homepage: "https://resend.com",
    docsUrl: "https://resend.com/docs",
    npmPackages: ["resend"],
    sources: [
      { type: SourceType.HTML, url: "https://resend.com/changelog" },
      { type: SourceType.RSS, url: "https://resend-status.com/feed.rss" },
    ],
  },
  {
    slug: "sendgrid",
    name: "SendGrid",
    category: "email",
    homepage: "https://sendgrid.com",
    docsUrl: "https://www.twilio.com/docs/sendgrid",
    npmPackages: ["@sendgrid/mail", "@sendgrid/client"],
    sources: [
      { type: SourceType.RSS, url: "https://status.sendgrid.com/history.rss" },
    ],
  },
  {
    slug: "postmark",
    name: "Postmark",
    category: "email",
    homepage: "https://postmarkapp.com",
    docsUrl: "https://postmarkapp.com/developer",
    npmPackages: ["postmark"],
    sources: [
      { type: SourceType.RSS, url: "https://status.postmarkapp.com/history.rss" },
    ],
  },
  {
    slug: "twilio",
    name: "Twilio",
    category: "communications",
    homepage: "https://www.twilio.com",
    docsUrl: "https://www.twilio.com/docs",
    npmPackages: ["twilio"],
    sources: [
      { type: SourceType.RSS, url: "https://www.twilio.com/en-us/changelog/feed" },
      { type: SourceType.RSS, url: "https://status.twilio.com/history.rss" },
    ],
  },
  {
    slug: "supabase",
    name: "Supabase",
    category: "database",
    homepage: "https://supabase.com",
    docsUrl: "https://supabase.com/docs",
    npmPackages: ["@supabase/supabase-js", "@supabase/ssr"],
    sources: [
      { type: SourceType.RSS, url: "https://github.com/supabase/supabase/releases.atom" },
      { type: SourceType.RSS, url: "https://status.supabase.com/history.rss" },
    ],
  },
  {
    slug: "neon",
    name: "Neon",
    category: "database",
    homepage: "https://neon.tech",
    docsUrl: "https://neon.tech/docs",
    npmPackages: ["@neondatabase/serverless"],
    sources: [
      { type: SourceType.RSS, url: "https://neon.tech/docs/changelog/rss.xml" },
    ],
  },
  {
    slug: "planetscale",
    name: "PlanetScale",
    category: "database",
    homepage: "https://planetscale.com",
    docsUrl: "https://planetscale.com/docs",
    npmPackages: ["@planetscale/database"],
    sources: [
      { type: SourceType.RSS, url: "https://planetscale.com/changelog/feed.xml" },
      { type: SourceType.RSS, url: "https://www.planetscalestatus.com/history.rss" },
    ],
  },
  {
    slug: "upstash",
    name: "Upstash",
    category: "database",
    homepage: "https://upstash.com",
    docsUrl: "https://upstash.com/docs",
    npmPackages: ["@upstash/redis", "@upstash/ratelimit", "@upstash/qstash"],
    sources: [
      { type: SourceType.HTML, url: "https://upstash.com/blog" },
      { type: SourceType.RSS, url: "https://status.upstash.com/history.rss" },
    ],
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    category: "infra",
    homepage: "https://www.cloudflare.com",
    docsUrl: "https://developers.cloudflare.com",
    npmPackages: ["wrangler", "@cloudflare/workers-types"],
    sources: [
      { type: SourceType.RSS, url: "https://developers.cloudflare.com/changelog/rss.xml" },
      { type: SourceType.RSS, url: "https://www.cloudflarestatus.com/history.rss" },
    ],
  },
  {
    slug: "aws-s3",
    name: "AWS S3",
    category: "infra",
    homepage: "https://aws.amazon.com/s3",
    docsUrl: "https://docs.aws.amazon.com/s3",
    npmPackages: ["@aws-sdk/client-s3", "aws-sdk"],
    sources: [
      { type: SourceType.RSS, url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/" },
    ],
  },
  {
    slug: "railway",
    name: "Railway",
    category: "infra",
    homepage: "https://railway.com",
    docsUrl: "https://docs.railway.com",
    npmPackages: ["@railway/cli"],
    sources: [
      { type: SourceType.HTML, url: "https://railway.com/changelog" },
      { type: SourceType.RSS, url: "https://status.railway.com/history.rss" },
    ],
  },
  {
    slug: "paypal",
    name: "PayPal",
    category: "payments",
    homepage: "https://www.paypal.com",
    docsUrl: "https://developer.paypal.com/docs",
    npmPackages: ["@paypal/checkout-server-sdk", "@paypal/paypal-js"],
    sources: [
      { type: SourceType.HTML, url: "https://developer.paypal.com/community/release-notes/" },
      { type: SourceType.RSS, url: "https://www.paypal-status.com/feed/rss" },
    ],
  },
  {
    slug: "shopify",
    name: "Shopify API",
    category: "commerce",
    homepage: "https://www.shopify.com",
    docsUrl: "https://shopify.dev",
    npmPackages: ["@shopify/shopify-api", "@shopify/shopify-app-remix"],
    sources: [
      { type: SourceType.RSS, url: "https://shopify.dev/changelog/feed.xml" },
      { type: SourceType.RSS, url: "https://www.shopifystatus.com/history.rss" },
    ],
  },
  {
    slug: "google-maps",
    name: "Google Maps Platform",
    category: "geo",
    homepage: "https://mapsplatform.google.com",
    docsUrl: "https://developers.google.com/maps",
    npmPackages: ["@googlemaps/google-maps-services-js", "@googlemaps/js-api-loader"],
    sources: [
      { type: SourceType.HTML, url: "https://developers.google.com/maps/documentation/javascript/releases" },
    ],
  },
  {
    slug: "algolia",
    name: "Algolia",
    category: "search",
    homepage: "https://www.algolia.com",
    docsUrl: "https://www.algolia.com/doc",
    npmPackages: ["algoliasearch", "react-instantsearch"],
    sources: [
      { type: SourceType.RSS, url: "https://status.algolia.com/history.rss" },
    ],
  },
  {
    slug: "sentry",
    name: "Sentry",
    category: "monitoring",
    homepage: "https://sentry.io",
    docsUrl: "https://docs.sentry.io",
    npmPackages: ["@sentry/nextjs", "@sentry/node", "@sentry/react"],
    sources: [
      { type: SourceType.RSS, url: "https://github.com/getsentry/sentry-javascript/releases.atom" },
      { type: SourceType.RSS, url: "https://status.sentry.io/history.rss" },
    ],
  },
  {
    slug: "posthog",
    name: "PostHog",
    category: "analytics",
    homepage: "https://posthog.com",
    docsUrl: "https://posthog.com/docs",
    npmPackages: ["posthog-js", "posthog-node"],
    sources: [
      { type: SourceType.RSS, url: "https://posthog.com/changelog/rss.xml" },
      { type: SourceType.RSS, url: "https://status.posthog.com/history.rss" },
    ],
  },
];

async function main(): Promise<void> {
  for (const seed of providers) {
    const provider = await prisma.provider.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        category: seed.category,
        homepage: seed.homepage,
        docsUrl: seed.docsUrl,
        npmPackages: seed.npmPackages,
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        category: seed.category,
        homepage: seed.homepage,
        docsUrl: seed.docsUrl,
        npmPackages: seed.npmPackages,
      },
    });
    for (const source of seed.sources) {
      await prisma.source.upsert({
        where: { providerId_url: { providerId: provider.id, url: source.url } },
        update: { type: source.type },
        create: { providerId: provider.id, type: source.type, url: source.url },
      });
    }
  }
  const count = await prisma.provider.count();
  process.stdout.write(`Seeded ${count} providers.\n`);
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`Seed failed: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
