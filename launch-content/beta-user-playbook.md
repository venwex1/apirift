# Beta User Playbook — first 10 paying users

Goal: 20 activated beta users → 10 paying conversions when the beta coupon
lapses (month 4). Everything here is manual, personal, and honest — at this
stage you are selling trust, not software.

---

## The 5 communities (and why these five)

1. **Indie Hackers (Product launch + daily standup threads)** — highest
   density of people who ARE the ICP: solo founders running revenue products
   on 10+ APIs, who personally eat the outage when something breaks. IH
   culture rewards honest "I built this after being burned" stories and
   punishes hype — which is the only story we have, so we're aligned.
   Post: `indie-hackers-post.md`.

2. **r/SaaS** — same persona, bigger funnel, more skeptical. Technical enough
   to appreciate the "LLM never fetches pages" detail, jaded enough that the
   no-fake-metrics honesty reads as a feature. Read the sub's self-promo rules
   the day you post; lead with the problem story, link once at the bottom.
   Post: `reddit-r-saas-post.md`. (Posting manually as yourself is fine —
   the "no Reddit API" constraint is about automation, not participation.)

3. **Hacker News (Show HN)** — the audience most likely to have *personally*
   debugged an upstream breaking change this month. HN converts poorly to
   signups but brilliantly to (a) registry requests that improve the product
   and (b) credibility you can link from everywhere else. Expect blunt
   comments; answer every technical question. Post: `hacker-news-show-hn.txt`.
   Post Tue–Thu, 14:00–16:00 UTC.

4. **Dev.to** — the technical-article channel. The architecture write-up
   (`content/launch/devto-article.md` in the repo) does slow-burn acquisition:
   it ranks for "API deprecation monitoring"-adjacent searches and marks you
   as the person who built the thing, not a growth hacker. Zero-maintenance
   after posting.

5. **Changelog-adjacent Discord/Slack communities** (pick two: e.g. the
   Indie Worldwide Slack, a Next.js/Vercel community Discord, an AI-builders
   Discord you're already in) — small-N, high-trust. Don't broadcast; watch
   for someone mentioning an API break or dependency pain and reply with the
   DM template's spirit: their problem first, link second. 1:1 beats 1:many
   at this stage. Only communities where you're already a member — joining
   to promote is astroturfing-adjacent and gets smelled instantly.

**Deliberately NOT on the list:** Product Hunt (save it for week 3–4 — you
get one PH launch; spend it after beta feedback has sanded the onboarding),
Twitter/X broadcast posting (no audience yet = shouting into void; the DM
template targeting people with the *documented* pain is the only X motion
worth doing), and any channel requiring automation against platform ToS.

---

## Timeline

### Day 1 (pick a Tuesday)
- Morning: final pre-flight — run through signup → paste package.json →
  see report yourself on a fresh account. Verify the GitHub Actions cron ran
  in the last hour (repo → Actions tab) and /p/stripe shows fresh entries.
- 14:00–16:00 UTC: Show HN goes up. Stay at the keyboard for 4–5 hours and
  answer literally every comment within minutes — response speed is the
  ranking algorithm and the trust signal.
- Same afternoon: IH post goes up (different audience, no cannibalization).
- Evening: log every registry request in a list; reply "added — live now" as
  you ship them. Same-day provider adds are the beta's killer demo.

### Day 3
- r/SaaS post (spacing avoids looking like a blitz, and Day-1 feedback will
  already have improved your answers).
- Send the first 5 cold DMs (X search: "deprecated api" / "breaking change"
  / "sunset" + complaints from the last 30 days; personalize every one).
- Email every Day-1 signup who did NOT run an impact report (check PostHog:
  `signup` without `impact_report_created`), personally, one line: "What
  stopped you?" — replies here are worth more than any post.

### Day 7
- Dev.to article goes up (link the HN discussion if it went well).
- Personal email to every activated user: the 4 feedback questions (below) +
  the beta coupon link for 3 months of Pro free.
- 5 more DMs. Tally the week: signups, activation rate, provider requests,
  reply rates per channel. Double down on whichever channel produced
  *activated* users (not signups) — kill the rest without sentiment.

---

## Offering free Pro (mechanics)

Stripe coupon **`UPSTREAM-BETA`** — 100% off, repeating × 3 months, max 20
redemptions (creation script: `scripts/create-beta-coupon.mjs`; verify it
shows in Stripe Dashboard → Products → Coupons).

Redemption flow for a beta user (checkout already allows promo codes —
`allow_promotion_codes: true` is set in `lib/stripe.ts`):
1. In Stripe Dashboard → Coupons → UPSTREAM-BETA → create a **promotion code**
   with code `UPSTREAM-BETA` (coupons need a customer-facing promo code).
2. Tell the user: "Go to Settings → Upgrade to Pro → in Stripe Checkout,
   click 'Add promotion code' → enter UPSTREAM-BETA."
3. They subscribe at $0 for 3 months; month 4 bills $12 unless they cancel —
   **say this out loud when you give them the code.** Surprise billing is how
   you turn a beta user into a public complaint.

Why coupon > manual plan override: it exercises the real checkout + webhook
path (every beta user tests your billing pipeline for free) and conversion at
month 4 is a decision they already made once, not a new sales motion.

---

## What to ask beta users (in exchange for free Pro)

Ask exactly these four, one email, numbered — vague "any feedback?" gets
vague nothing:

1. "Walk me through the first 5 minutes: where did you hesitate, and what
   did you expect to happen that didn't?"
2. "Which providers are missing for this to cover your real stack?" (highest
   signal for the roadmap — and same-day adds create loyalty)
3. "Has an alert or digest told you something you didn't already know? If
   yes, what — if no, that's the most important answer you can give me."
4. "At the end of the free 3 months, would you pay $12/month? If not, what
   would have to be true?" (the only question that predicts revenue)

Plus one standing request: "If it ever alerts you about something that saves
you real time, tell me the story — with your permission I'll quote it, named
or anonymous, your call." (This is how you get honest testimonials without
manufacturing them.)

---

## Tracking activation in PostHog

Events already instrumented (`lib/analytics.ts`) — build one funnel and one
dashboard, 15 minutes:

**Activation funnel:** `signup` → `watch_added` OR `impact_report_created`
(within 24h) → *activated*.
- signup→activated < 40%: onboarding problem — the empty state or welcome
  email isn't landing. Fix before spending another hour on posts.

**Watch weekly:**
- `impact_report_created` — the "aha" event; users who run one have seen the
  product's whole value in ten seconds.
- `alert_sent` + `digest_sent` — the retention events. A user who receives a
  *useful* alert in week 1–2 is your future paying user.
- `limit_hit` → `upgrade_started` → `upgrade_completed` — the money funnel.
  During beta, `upgrade_completed` with the coupon = a "conversion rehearsal."
- `referral_recorded` — early referrals are the strongest possible signal;
  personally thank anyone who triggers one.

**Manual weekly ritual (Sunday, 20 min):** for each beta user, one row:
activated? / alerts received? / replied to feedback? / provider requests?
Ten rows. If you can't fill the row, that's the signal to reach out — at
n=20, retention is done by hand, on purpose.
