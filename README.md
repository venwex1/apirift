# ApiRift

**Know before it breaks.** Autonomous monitoring for every API your product
depends on — changelogs, deprecations, incidents — classified by severity
against your actual stack, delivered as instant alerts and weekly digests.

## Architecture

See `docs/ARCHITECTURE.md` for the system diagram, API contract, failure-mode
analysis, and scaling plan. See `docs/LAUNCH.md` for the exact go-live steps.

The one-paragraph version: Vercel crons poll every registered changelog/status
source every 30 minutes (content-hashed, so unchanged sources are ~free),
deterministic extractors turn changed feeds into candidate entries, Claude
Haiku classifies them against a strict zod schema (kind, severity, affected
surfaces, deadline), and fan-out routes high-severity changes to paid
watchers instantly with everything else in Monday digests. Every stage is
idempotent via database constraints, budget-capped, and degrades to visible
"pending" states rather than failing.

## Local development

```bash
# 1. Install
npm install

# 2. Environment — copy and fill (see .env.example for descriptions)
cp .env.example .env

# 3. Database
npx prisma migrate dev --name init
npx prisma db seed        # loads the 24-provider registry

# 4. Run
npm run dev               # app on http://localhost:3000
npm run email:dev         # React Email preview on :3001 (optional)

# 5. Exercise the pipeline manually (replace with your CRON_SECRET)
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/poll-sources
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/classify-changes
```

Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
Clerk webhooks locally: use the Clerk dashboard's webhook testing against a tunnel (e.g. `ngrok`).

## Verification

```bash
npm run typecheck   # TS strict, noUncheckedIndexedAccess — must be clean
npm run lint
```

`/api/health` reports `{ status, checks, timestamp }` across DB, Redis,
Stripe, Anthropic, and R2 — Better Stack polls it every 60s in production.

## Deployment

Vercel (frontend + API + crons). `vercel.json` defines the six cron jobs and
function budgets. Full checklist with exact dashboard steps: `docs/LAUNCH.md`.

## Repo map

```
app/(marketing)   landing, pricing, blog (MDX)
app/(app)         dashboard, registry, impact, alerts, settings, referral
app/p/[slug]      public per-provider change history (the SEO engine)
app/r/[id]        public shareable impact reports (the viral unit)
app/api           stripe, webhooks, feature routes, cron jobs, health
lib               db, stripe, ai, redis, email, errors, plans, sources, impact
prisma            schema + registry seed
emails            React Email templates (lifecycle + alerts + digest)
content/blog      three launch posts (MDX)
content/launch    Product Hunt / Show HN / Dev.to copy
docs              ARCHITECTURE.md, LAUNCH.md
```
