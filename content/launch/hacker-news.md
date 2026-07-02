# Show HN post

**Title:**
Show HN: Upstream – I built a bot that reads 400 API changelogs so I don't

**Opening text:**

Upstream monitors every third-party API your product depends on — changelogs, status pages, deprecation notices — and alerts you when something will actually break you, before it does. I built it after my payment provider's webhook signature change took down my checkout: the change was announced publicly six weeks earlier, and I found out from a customer email. It works by polling every source on a 30-minute cron, extracting entries deterministically (the LLM never fetches or parses — only classifies bounded excerpts against a strict JSON schema, which keeps prompt injection from third-party pages contained), and routing by severity: breaking changes become instant alerts with the affected surface and deadline, everything else lands in a Monday digest where silence genuinely means nothing happened. Free for 5 providers, and the per-provider change histories are public: https://upstream.watch
