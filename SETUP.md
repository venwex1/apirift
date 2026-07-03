# ApiRift — Quality Gate Setup

Checkpoint-based CI/CD: every stage must pass before the next begins.
Failures halt the pipeline, comment on the PR with details, and (in
production) trigger automatic rollback plus a founder alert email.

| Checkpoint | When | What | On failure |
|---|---|---|---|
| **CP1** static analysis | every push + PR | `tsc --noEmit`, `next lint` | Block merge, PR comment with exact errors |
| **CP2** E2E suite | after CP1 | Playwright vs the commit's Vercel deployment (preview for PRs, production for main) | Block merge, PR comment + report artifact |
| **CP3** preview smoke | after CP2, PRs only | HTTP 200 on `/`, `/pricing`, `/providers`, `/api/health`; title contains "ApiRift"; health `status: "ok"` | PR comment: do not promote |
| **CP4** production check | after CP2, main pushes | `apirift.com/api/health` → `status:"ok", db:true, redis:true` + page smoke | **Auto-rollback** via Vercel + alert email |
| **CP5** monitor | every 6 h (cron) | Production smoke: `/`, `/pricing`, `/api/health` | Alert email to founder |

Workflows: `.github/workflows/quality-gates.yml` (CP1–4) and
`production-monitor.yml` (CP5). The existing `upstream-cron.yml`
(apirift-cron, the 30-minute data pipeline) is untouched and unrelated.

---

## 1. One-time local install (required before first CI run)

```bash
npm install          # picks up @playwright/test + @clerk/testing, updates package-lock.json
npx playwright install --with-deps chromium
git add package-lock.json && git commit -m "Lockfile: playwright + clerk testing"
```

CI prefers `npm ci` (exact lockfile); committing the refreshed lockfile is
what makes the pipeline deterministic.

## 2. GitHub Actions secrets (repo → Settings → Secrets and variables → Actions)

| Secret | Value / where to get it |
|---|---|
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys (same value as in Vercel) — needed by `@clerk/testing` to mint testing tokens |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create (scope: the `umutalp8898-4118s-projects` team) |
| `VERCEL_PROJECT_ID` | Fetch it: `curl -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/upstream?slug=umutalp8898-4118s-projects"` → copy the `"id"` field (starts with `prj_`). Also visible at Vercel → project `upstream` → Settings → General. |
| `TEST_USER_EMAIL` | Dedicated Clerk test account (see §3) |
| `TEST_USER_PASSWORD` | Same account's password |
| `RESEND_API_KEY` | Same key the app uses (Vercel env) — for CP4/CP5 alert emails |
| `EMAIL_FROM` | Same as the app's `EMAIL_FROM` |
| `FOUNDER_EMAIL` | Where alerts land |

The team slug (`umutalp8898-4118s-projects`) and production URL
(`https://apirift.com`) are plain env values inside the workflows — edit
there if they ever change.

## 3. Create the Clerk test account (manual, once)

1. Clerk dashboard → your ApiRift application → **Users → Create user**.
2. Email: something obvious like `e2e-test@yourdomain.com`; set a strong
   password. This must be a **dedicated** account — tests sign in as it on
   every CI run and will exercise the upgrade flow to the Stripe redirect.
3. Ensure **email + password** sign-in is enabled for the instance, and don't
   enroll this user in MFA.
4. Put the credentials in `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (GitHub
   secrets, and your local `.env.local` if you want to run the authed suite
   locally). If these are absent, authenticated tests skip cleanly rather
   than fail — but CI is only doing its full job once they're set.
5. Keep this account on the **free plan**: the upgrade test needs the
   "Upgrade to Pro" button to exist (it stops at the `checkout.stripe.com`
   redirect and never enters payment details — Stripe is in live mode).

## 4. Branch protection (makes "block merge" real)

GitHub → Settings → Branches → protect `main` → require status checks:
`CP1 · static analysis`, `CP2 · E2E suite`, `CP3 · preview smoke`.
Without this, the checkpoints still run and report, but GitHub won't
physically stop a merge.

## 5. Running locally

```bash
npm run test:e2e                # starts next dev automatically, runs everything
npx playwright test --project=unauthenticated   # public pages only
PLAYWRIGHT_BASE_URL=https://apirift.com npm run test:e2e   # against prod
npm run test:e2e:ui             # headed debugging
node scripts/ci/smoke.mjs --base=https://apirift.com --mode=production
```

## 6. Health endpoint contract

`GET /api/health` returns:

```json
{
  "status": "ok" | "degraded" | "down",
  "db": true, "redis": true, "resend": true,
  "timestamp": "2026-07-03T…",
  "checks": { "database": {…}, "redis": {…}, "resend": {…}, "stripe": {…}, "ai": {…}, "storage": {…} }
}
```

`status` is computed from **db + redis + resend**: all pass → `ok`, some →
`degraded`, none → `down`. HTTP is 503 when status is `down` or the database
specifically is unreachable (keeps Better Stack paging on the failures that
matter); 200 otherwise. `stripe`/`ai`/`storage` remain in `checks` as
informational detail.

## 7. Known deviations from the checkpoint spec (deliberate)

- **/providers is auth-gated** (it renders per-user watch state), so the
  *unauthenticated* suite asserts it redirects to sign-in, and the
  "provider cards visible" assertion runs in the *authenticated* suite.
  Public provider content is covered via `/p/stripe`.
- **The Stripe-redirect test is authenticated** — `/api/stripe/checkout`
  requires a session; an anonymous visitor's upgrade path goes through
  sign-up. The test clicks Upgrade in Settings, confirms the modal, asserts
  arrival at `checkout.stripe.com`, and stops.
- **Rollback uses the Vercel CLI** (`vercel rollback`, with `vercel promote`
  as fallback) pointed at the previous READY production deployment — more
  stable than hand-rolled REST calls.
