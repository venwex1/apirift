# Product Hunt

**Tagline** (59/60 chars):
Alerts before the APIs you build on break your product

**Short description** (258/260 chars):
Your product runs on APIs that change without asking. ApiRift reads every changelog, status page, and deprecation notice in your stack, classifies what matters by severity, and alerts you before the deadline hits. Paste a package.json — watched in a minute.

**Three-bullet feature list:**

- **Paste-and-done setup** — drop in your package.json; your dependencies are mapped to providers and every recent breaking change across your actual stack appears in ten seconds.
- **Signal, not feeds** — an LLM classifies every changelog entry (breaking / deprecation / incident, severity, affected surface); only what can hurt you interrupts you, the rest waits for Monday's digest.
- **Deadlines become countdowns** — "sunsets March 1" turns into "41 days, affects webhook signatures, here's the migration step," ticking on your dashboard until it's handled.

**First comment (founder story):**

Hey Product Hunt 👋

I've shipped three SaaS products solo, and each one was eventually broken by code I didn't write: a payment provider changing webhook signatures, an AI vendor retiring a model, an SDK major encoding an upstream API change. The worst one killed my checkout at midnight — six weeks after the change was publicly announced in a changelog I never read. I debugged my own code for hours before finding the answer in someone else's release notes.

That's the gap ApiRift fills. A typical product depends on 10–25 external APIs, each publishing changes in its own format at its own URL. Enterprises pay platform teams to read all of it. Solo founders and small teams run on production errors and luck. Reading everything was never worth a human's time — which is exactly why it's a perfect job for software, now that LLM classification costs fractions of a cent.

How it works: deterministic polling and extraction of every changelog/status source (the LLM never fetches pages — it only classifies bounded excerpts against a strict schema, so third-party content can't steer it), then routing by severity. Breaking changes and deadlines reach your inbox; noise dies in the pipeline. Deprecations with dates become countdowns. And the registry is shared infrastructure — Stripe gets watched once, for everyone, so every provider request I fulfill ships to all users at once.

Honest state: launched this week. 24 providers in the registry and growing on request (usually same-day). Free tier is 5 providers + a weekly digest, no card. I'm looking for early users who'll tell me exactly where it falls short — the first 20 get 3 months of Pro free.

The question I most want answered in the comments: which provider would need to be in the registry for you to use this tomorrow?
