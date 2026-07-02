# Product Hunt launch

**Title** (max 60 chars):
Upstream — Know before it breaks

**Tagline** (max 60 chars):
Autonomous monitoring for every API your product runs on

**Description** (max 260 chars):
Your product is built on APIs that change without asking. Upstream reads every changelog, status page, and deprecation notice in your stack, classifies what matters, and alerts you before it breaks you. Paste a package.json — watched in 60 seconds.

**First comment** (the founder's story):

Hey Product Hunt 👋

I've shipped three SaaS products as a solo founder, and every one of them taught me the same lesson in the same painful way: the bug that takes your product down is usually merged by someone you've never met.

My checkout flow once broke on a Tuesday morning. No deploy, no error spike, nothing in my code. My payment provider had changed webhook signature verification — announced in their changelog six weeks earlier, with a migration deadline that passed at midnight. Six weeks of warning, publicly available, and I found out from an angry customer email.

That's when it clicked: I monitor my own code obsessively — Sentry, uptime checks, logs — but nothing monitors the 20+ companies whose APIs my products are actually made of. Big companies pay platform teams to read vendor changelogs. Solo founders have production errors and luck.

The reason this product didn't exist before is economic: reading 400 changelogs a week and deciding what matters *to your specific stack* was never worth a human salary. LLM classification made it cost fractions of a cent. So I built the thing I needed.

How it works: paste your package.json (or pick providers from the registry). Upstream polls every changelog, status feed, and release channel every 30 minutes, classifies each entry by severity and affected surface, and turns deprecations-with-dates into countdowns against your stack. Breaking change in an API you use? Alert in your inbox within minutes, with the specific action to take. Feature announcements? One line in Monday's digest. Silence means genuinely nothing happened — that's the whole point.

The hard engineering was making it fully autonomous: content-hash polling, structural idempotency (database constraints ARE the dedupe logic), a daily AI budget cap so a misbehaving feed can't cause a surprise invoice, and sources that self-disable and report when they rot. It runs without me. That was a design requirement — I built this because I don't have time to watch things.

Free tier watches 5 providers with a weekly digest. Pro ($12/mo) is unlimited providers + instant alerts.

What was hard: extraction from arbitrary HTML changelogs without letting third-party content anywhere near tool-capable AI (the classifier has a strict JSON schema and no tools — prompt injection from a malicious changelog can mislabel severity, but that's the ceiling). What I learned: the registry is the real product. Every provider added serves every user at once.

I'll be here all day — ask me anything, and tell me which providers you need in the registry. Adding one takes minutes and ships to everyone.
