import { z } from "zod";

/**
 * Environment validation. Imported from next.config.ts so a misconfigured
 * deployment fails at build time, not at 3 a.m. via a runtime exception.
 *
 * Client-side code must only read NEXT_PUBLIC_* values directly from
 * process.env (Next.js inlines them); everything else goes through `env`.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_PRO_MONTHLY: z.string().min(1),
  STRIPE_PRICE_PRO_YEARLY: z.string().min(1),
  STRIPE_PRICE_TEAM_MONTHLY: z.string().min(1),
  STRIPE_PRICE_TEAM_YEARLY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  AI_DAILY_CALL_BUDGET: z.coerce.number().int().positive().default(2000),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  FOUNDER_EMAIL: z.string().email(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  CRON_SECRET: z.string().min(16),
});

function loadEnv(): z.infer<typeof serverSchema> {
  // Allow CI static-analysis steps (tsc, next lint) to skip validation so
  // they don't need all 20+ secrets wired up as Actions secrets.
  // Vercel production builds always run with SKIP_ENV_VALIDATION unset.
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as z.infer<typeof serverSchema>;
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid environment. Fix these variables: ${missing}`);
  }
  return parsed.data;
}

export const env = loadEnv();
