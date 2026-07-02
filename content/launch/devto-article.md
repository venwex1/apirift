# Dev.to launch article

**Title:** I built an autonomous system that reads every API changelog on the internet — here's the architecture

**Tags:** webdev, typescript, nextjs, architecture

---

Every product I've shipped has eventually been broken by code I didn't write and couldn't see coming: a payment provider changing webhook signatures, an AI vendor retiring a model, an SDK major that encoded an upstream API change. The information was always public — changelogs, status pages, deprecation notices — and I never read it, because nobody reads 25 vendor feeds a week.

So I built Upstream (https://upstream.watch), a system that reads all of it autonomously and tells each user about the subset that affects *their* stack. This post covers the four engineering decisions I'd defend in a design review, with code.

## The shape of the problem

The naive solution — aggregate all the feeds — has been tried and fails predictably: an unfiltered firehose trains users to ignore it. The actual job is *classification against a user's integration surface*: is this entry breaking? For which API surface? With what deadline? That used to require a human reading prose. It's now a sub-cent LLM call, which is the entire economic unlock that makes this product possible in 2026 and impossible in 2022.

## Decision 1: The LLM classifies. It never fetches, parses, or acts.

The pipeline is deterministic plumbing around one tightly constrained act of machine reading:

```
poll (cron, 30min) → hash → extract (code) → dedupe (constraint)
  → classify (LLM, schema-validated) → route (severity) → email/digest
```

Extraction from RSS/JSON/HTML is plain TypeScript. Content-hashing short-circuits unchanged sources, so an unchanged changelog costs one HTTP request and zero tokens. Only new entries reach the model, as bounded excerpts inside a JSON envelope, and the only legal output is:

```ts
const classificationSchema = z.object({
  kind: z.enum(["BREAKING", "DEPRECATION", "INCIDENT",
                "SECURITY", "FEATURE", "MAINTENANCE", "NOTICE"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
  summary: z.string().min(1).max(500),
  affectedSurfaces: z.array(z.string().max(80)).max(8),
  actionRequired: z.string().max(500).nullable(),
  effectiveAt: z.string().nullable(),
});
```

This is also the security boundary. Changelog pages are third-party content; if a tool-capable agent interpreted them wholesale, a malicious page could steer it. Here, adversarial content can at worst produce a wrong label — the classifier has no tools and its output has no interpretation beyond `safeParse`. Entries that fail validation three times are shown *unclassified* rather than dropped. A visible "classification pending" is honest; a silently swallowed entry is a lie about your risk.

## Decision 2: Idempotency lives in the schema, not the code

Everything runs on serverless crons, so every job must survive being killed mid-flight and re-run. Instead of careful bookkeeping, database constraints arbitrate:

```prisma
model Change {
  externalKey String  // sha256(url + title)
  @@unique([providerId, externalKey])   // re-polling inserts nothing
}

model Alert {
  sentAt DateTime?    // null = claimed but not delivered
  @@unique([userId, changeId, channel]) // fan-out claims exactly once
}

model WebhookEvent {
  id String @id       // Stripe event id — insert first, unique violation = already processed
}
```

The alert pattern is my favorite: `createMany(skipDuplicates)` claims deliveries, `sentAt = null` marks the undelivered remainder, and a crashed run resumes exactly where it died. Exactly-once creation, at-least-once delivery, zero coordination code.

## Decision 3: Hard budgets, soft failures

An autonomous system calling a paid API needs a ceiling. Classification consumes from a daily Redis counter; over budget, entries stay pending and process tomorrow. The guard fails *open* on Redis errors — it protects cost, not correctness.

Every dependency follows the same asymmetry. Rate limiter down? Fail open. Cache down? Fall through to the DB. AI down? Pending states, never errors. A source that 404s five consecutive polls disables itself and files a Sentry event, so the registry heals instead of rotting silently.

## Decision 4: The moat is a boring table

The compounding asset is the `Change` table: a structured, growing history of how every major API actually behaves — who breaks things, how much deprecation notice they really give, what "stable" means per vendor. Monitoring is shared infrastructure (Stripe gets watched once, for everyone), so marginal cost per user is ~zero while the history deepens every 30 minutes. The pipeline is copyable in a month. The table isn't.

## Stack

Next.js 15 App Router (TS strict, `noUncheckedIndexedAccess`), Prisma + Neon, Clerk, Stripe, Claude Haiku for classification, Upstash Redis, Resend + React Email, Vercel crons. No queue on day one — cron plus structural idempotency covers launch scale, and the fan-out seam is one file so a queue slots in when numbers demand it.

If you build on third-party APIs (you do), the per-provider change histories are public at https://upstream.watch — and if a provider you depend on is missing from the registry, tell me and it ships to everyone.
