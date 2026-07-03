# r/SaaS post

**Title:** The outages that hurt most weren't my code — they were other people's changelogs. So I automated reading them.

---

Quick question before the story: do you know, right now, whether any API you depend on has announced a deprecation with a deadline in the next 90 days?

I didn't either. That's the problem.

I run SaaS products solo. My monitoring stack was decent — error tracking, uptime checks, logs. All of it watches *my* code. But a modern SaaS is mostly not your code: payments, auth, email, AI models, hosting, storage — 10 to 25 external APIs for a typical product. Every one of them ships changes on their schedule, announced in changelogs and status feeds you don't read.

The failure mode is always the same and it's always dumb: provider announces a breaking change weeks ahead → nobody reads it → deadline hits → production breaks → you burn hours debugging *your* code before realizing the answer was published a month ago. Mine was a webhook signature scheme change that killed checkout. Six weeks of public notice. Found out from an angry customer.

The economics of why nobody solves this manually: reading ~40 changelog feeds weekly, deciding what applies to your specific integrations, is real work with almost-always-zero payoff — until the one entry that saves your quarter. Enterprises staff platform teams for exactly this. Solo founders and small teams can't.

What changed recently is that LLM classification became cheap enough that "read everything, decide what matters" is now viable as software. So I built it: **Upstream** (https://upstream-pi.vercel.app).

Mechanics, since this crowd will ask:

- Deterministic polling + content-hashing of every changelog/status source (the LLM never fetches pages — extraction is plain code, which keeps costs near zero and prompt-injection from third-party pages contained)
- Claude classifies new entries against a strict JSON schema: kind, severity, affected surfaces, stated deadline
- High severity on a provider you watch → email alert. Everything else → Monday digest. Deadlines → countdowns on your dashboard
- Paste your package.json and it maps dependencies → providers and shows you the last 90 days of breakage across your actual stack

Current state, honestly: launched days ago, 24 providers in the registry, adding more on request (same-day usually — one add serves every user). Free tier is 5 providers + weekly digest, no card. I'm looking for the first 20 beta users — 3 months of Pro free in exchange for blunt feedback.

The single most useful thing you can tell me: which provider would need to be in the registry for this to be useful to *you* on day one?
