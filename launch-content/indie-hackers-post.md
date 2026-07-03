# Indie Hackers post

**Title:** I built a bot that reads API changelogs after a six-week-old deprecation notice took down my checkout

---

Three products in, I've been burned the same way every time: something breaks in production, I spend hours hunting through my code, and the cause turns out to be someone else's changelog.

The worst one was checkout. A payment provider changed its webhook signature scheme — announced publicly, six weeks of migration window, clear deadline. The deadline passed at midnight; my checkout died at midnight. I found out from a customer email at 6:47 a.m. The information that would have prevented it had been sitting in a changelog nobody reads, because nobody reads changelogs.

That's the actual problem: a typical solo product depends on 10–25 external APIs. Each publishes changes in a different format at a different URL. Almost all of it is noise — but a few entries a year are "this breaks you on a specific date." Reading everything is a job nobody does; big companies literally pay platform teams for it. The rest of us run on production errors and luck.

So I built ApiRift (https://upstream-pi.vercel.app). What it does:

- You paste your package.json (or pick providers from a registry). Takes about a minute.
- It polls every changelog and status feed for those providers, round the clock, and uses an LLM to classify each entry: breaking / deprecation / incident / feature, severity, which API surface, and any stated deadline.
- Breaking changes and deadlines become alerts. Everything else waits for a Monday digest. Deprecations with dates become countdowns — "sunsets Aug 12" shows up as "41 days left, affects webhook signatures."

Honest current state: it's live, it's early, and it's exactly what it says — the registry covers 24 providers so far (Stripe, OpenAI, Anthropic, Vercel, Clerk, Supabase, Twilio, Shopify, etc.), and I add new ones on request, usually same-day, which then ship to every user at once. The free tier (5 providers + weekly digest) is genuinely usable. No fake numbers to show you: I launched days ago and I'm looking for my first real users, not pretending to have thousands.

What I'm looking for:

1. **Beta users** — I'm giving the first 20 people 3 months of Pro free (unlimited providers, instant alerts) in exchange for honest feedback. No card needed for the free tier either.
2. **Brutal feedback** — especially: which provider is missing from the registry that you'd need on day one? That's the highest-signal thing you can tell me.

If you've ever debugged for three hours only to find the answer in someone else's release notes, this is for you. Ask me anything about how it works — the classification pipeline is the fun part and I'm happy to go deep.
