# Upstream — Launch runbook

## WHAT YOU NEED TO DO (in order, ~2.5 hours total)

1. **GitHub repo** (5 min) — push this codebase to a private repo.
2. **Neon** (10 min) — neon.tech → New project `upstream` (Postgres 16, us-east-1).
   Copy the **pooled** connection string → `DATABASE_URL`; the **direct** one →
   `DIRECT_URL`. Verify "Point-in-time restore" shows enabled on the project
   (it is by default on all plans — this is the primary backup).
3. **Stripe** (20 min) — dashboard.stripe.com → Product catalog → Add product:
   - Product "Upstream Pro": price $12/month recurring → copy price ID →
     `STRIPE_PRICE_PRO_MONTHLY`; add second price $115/year → `STRIPE_PRICE_PRO_YEARLY`.
   - Product "Upstream Team": $29/month → `STRIPE_PRICE_TEAM_MONTHLY`;
     $278/year → `STRIPE_PRICE_TEAM_YEARLY`.
   - Developers → API keys → secret key → `STRIPE_SECRET_KEY`.
   - Settings → Billing → Customer portal → enable it (allow cancel + payment
     method update).
   - Webhooks: added in step 12 (needs the domain first).
4. **Clerk** (15 min) — clerk.com → Create application "Upstream" (email +
   Google). Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
   Configure → Paths: sign-in `/sign-in`, sign-up `/sign-up`, after-auth `/dashboard`.
5. **Upstash** (5 min) — console.upstash.com → Create Redis database (regional,
   us-east-1) → copy REST URL + token → `UPSTASH_REDIS_REST_URL/_TOKEN`.
6. **Resend** (15 min + DNS wait) — resend.com → Domains → Add your domain →
   create the 3 DNS records it shows → verify. API keys → create →
   `RESEND_API_KEY`. Set `EMAIL_FROM="Upstream <signal@yourdomain>"` and
   `FOUNDER_EMAIL` to your inbox.
7. **Cloudflare R2** (10 min) — dash.cloudflare.com → R2 → Create bucket
   `upstream-backups`. Manage API tokens → create token (Object Read & Write,
   this bucket) → `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, plus your
   account id → `R2_ACCOUNT_ID`, `R2_BUCKET=upstream-backups`.
   Bucket settings → Object lifecycle → delete objects under `exports/` after 90 days.
8. **Anthropic** (5 min) — console.anthropic.com → API keys → `ANTHROPIC_API_KEY`.
   Set a monthly spend limit ($25 is generous headroom; the app's own daily
   cap is `AI_DAILY_CALL_BUDGET=2000` calls).
9. **Sentry** (10 min) — sentry.io → Create project (Next.js) →
   `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`; Auth token
   (project:releases scope) → `SENTRY_AUTH_TOKEN`. Alerts → create rule:
   "issue seen ≥2 times in 1h → email".
10. **PostHog** (5 min) — us.posthog.com → New project →
    `NEXT_PUBLIC_POSTHOG_KEY` (+ default `NEXT_PUBLIC_POSTHOG_HOST`).
11. **Vercel** (15 min) — vercel.com → Import the GitHub repo (needs the
    **Pro plan**: commercial use + cron frequency). Add ALL env vars from
    `.env.example` for Production. Set `NEXT_PUBLIC_APP_URL` to your domain.
    Generate `CRON_SECRET` (`openssl rand -hex 32`). Add your custom domain →
    set the DNS records Vercel shows. Deploy.
12. **Webhooks** (10 min) — now that the domain resolves:
    - Stripe → Developers → Webhooks → Add endpoint
      `https://<domain>/api/webhooks/stripe`, events: `checkout.session.completed`,
      `customer.subscription.created`, `customer.subscription.updated`,
      `customer.subscription.deleted`, `invoice.payment_failed`.
      Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy.
    - Clerk → Webhooks → Add endpoint `https://<domain>/api/webhooks/clerk`,
      event `user.created` → signing secret → `CLERK_WEBHOOK_SECRET` → same redeploy.
13. **Database init** (5 min) — locally with production `DIRECT_URL` in env:
    `npx prisma migrate deploy && npx prisma db seed`.
14. **Better Stack** (10 min) — betterstack.com → Uptime → Create monitor →
    URL `https://<domain>/api/health`, keyword check for `"status":"healthy"`
    is NOT required (status code is enough: 200 healthy/degraded, 503 unhealthy),
    frequency 60s → alert: email + SMS to you.
15. **Smoke test** (15 min) — run the launch checklist below, top to bottom.

## WHAT RUNS ITSELF AFTER THAT

- Polling of every registry source every 30 min; self-disabling of rotted
  sources with Sentry notification.
- Classification of every new change (budget-capped, self-retrying, never
  drops entries).
- Instant alert fan-out to paid watchers; weekly Monday digests to everyone;
  Team webhooks.
- The full lifecycle email program (welcome, day-3 ×2, day-7, day-14
  feedback→your inbox, day-30 win-back, upgrade prompt, payment-failed).
- All revenue flow: checkout, plan sync, cancellation downgrade, dunning via
  Stripe retries + email.
- Referral tracking and automatic Stripe-credit rewards on conversion.
- Public provider pages regenerating hourly (SEO), sitemap, OG images.
- Weekly R2 exports; daily Neon PITR; dependabot PRs (patch/minor grouped).
- Health monitoring with founder paging on real downtime.

## WHAT TO WATCH IN THE FIRST WEEK

1. **Signup → first watch within 24h** (PostHog: `signup` vs `watch_added`
   funnel). Under 40% → the Impact page isn't landing as the obvious first
   step; move it earlier in onboarding.
2. **`limit_hit` events** (PostHog). Zero limit-hits means free is too big or
   acquisition is too small — check which via signups. Limit-hits without
   `upgrade_started` within a day → the modal isn't converting; revisit copy.
3. **Classification failure rate** (`SELECT count(*) FROM "Change" WHERE
   status='FAILED'` vs total, or Sentry). Over ~5% → a source format changed;
   fix the extractor before trust erodes.

## LAUNCH CHECKLIST

- [ ] Neon provisioned; `DATABASE_URL` + `DIRECT_URL` in Vercel
- [ ] Upstash Redis provisioned; REST URL + token in Vercel
- [ ] Stripe products/prices created; 4 price IDs in Vercel
- [ ] Stripe webhook endpoint registered; signing secret in Vercel
- [ ] Stripe Customer Portal enabled
- [ ] Clerk app created; keys in Vercel; paths configured
- [ ] Clerk webhook registered (`user.created`); secret in Vercel
- [ ] Resend domain verified; API key in Vercel; FROM address set
- [ ] R2 bucket + token created; lifecycle rule (90d on exports/) set
- [ ] Anthropic key in Vercel; provider-side spend limit set
- [ ] Sentry DSN in Vercel; alert rule created
- [ ] PostHog key in Vercel
- [ ] Better Stack monitor on /api/health, 60s, email+SMS
- [ ] Vercel Pro, domain connected, DNS set, all env vars present
- [ ] `npx prisma migrate deploy` run against production
- [ ] `npx prisma db seed` run (registry: 24 providers)
- [ ] `/api/health` returns all-green `healthy`
- [ ] Manual cron test: poll-sources then classify-changes with CRON_SECRET;
      changes appear on /p/stripe
- [ ] Test signup → welcome email received → watch added → dashboard renders
- [ ] Test upgrade with Stripe test card → plan flips to PRO in app →
      subscription visible in Stripe
- [ ] Stripe CLI: send test `customer.subscription.deleted` → user downgrades
- [ ] Test referral: signup via `/?ref=<your code>` → Referral row appears
- [ ] Impact report on a real package.json → share link renders logged-out

## FINAL QUALITY PASS — reviewed

Every file re-read before handoff. Checks: TS strict + noUncheckedIndexedAccess
compliance, no `any`, no TODO/placeholder, every async path has explicit
failure handling, every webhook idempotent, every cron bounded + logged +
alarmed, no secrets in code, no raw user input in logs, empty/error/loading
states on every screen, focus-visible + aria on interactive elements,
reduced-motion respected.
