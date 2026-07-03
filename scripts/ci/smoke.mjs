/**
 * HTTP smoke test used by checkpoints 3 (preview), 4 (production), and
 * 5 (6-hourly monitor). No browser required — pure fetch assertions.
 *
 * Usage: node scripts/ci/smoke.mjs --base=https://apirift.com [--mode=preview|production]
 *
 * Checks:
 *   GET /            → 200, body contains "ApiRift" in <title>
 *   GET /pricing     → 200
 *   GET /api/health  → JSON status "ok"; in production mode additionally
 *                      asserts db === true and redis === true
 *
 * Note: Auth-gated routes (e.g. /providers) are NOT checked here. Clerk's
 * middleware redirects browser clients to sign-in but returns 404 for plain
 * HTTP fetch without a session cookie. The E2E Playwright suite (CP2) covers
 * the /providers → sign-in redirect behaviour end-to-end.
 *
 * Exit code 0 = all pass. Non-zero = failure; details on stderr, and a
 * summary is appended to $GITHUB_STEP_SUMMARY when available.
 */
import { appendFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  })
);

const base = (args.base ?? "").replace(/\/$/, "");
const mode = args.mode ?? "preview";
if (!base.startsWith("http")) {
  console.error("Usage: node scripts/ci/smoke.mjs --base=https://… [--mode=preview|production]");
  process.exit(1);
}

const failures = [];
const passes = [];

async function fetchWithTimeout(url, { redirect = "follow", ms = 20_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect,
      headers: { "user-agent": "apirift-quality-gate/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkPage(path, { titleMustContain } = {}) {
  const url = `${base}${path}`;
  try {
    const res = await fetchWithTimeout(url);
    if (res.status !== 200) {
      failures.push(`${path}: HTTP ${res.status} (expected 200)`);
      return;
    }
    if (titleMustContain) {
      const html = await res.text();
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
      if (!title.toLowerCase().includes(titleMustContain.toLowerCase())) {
        failures.push(`${path}: <title> is "${title}" — missing "${titleMustContain}"`);
        return;
      }
    }
    passes.push(`${path}: 200 OK`);
  } catch (err) {
    failures.push(`${path}: ${err.name === "AbortError" ? "timeout" : err.message}`);
  }
}


async function checkHealth() {
  const path = "/api/health";
  try {
    const res = await fetchWithTimeout(`${base}${path}`);
    const body = await res.json();
    if (body.status !== "ok") {
      failures.push(
        `${path}: status "${body.status}" (expected "ok") — db:${body.db} redis:${body.redis} resend:${body.resend}`
      );
      return;
    }
    if (mode === "production" && (body.db !== true || body.redis !== true)) {
      failures.push(`${path}: db:${body.db} redis:${body.redis} (both must be true)`);
      return;
    }
    passes.push(`${path}: status ok (db:${body.db} redis:${body.redis} resend:${body.resend})`);
  } catch (err) {
    failures.push(`${path}: ${err.name === "AbortError" ? "timeout" : err.message}`);
  }
}

await checkPage("/", { titleMustContain: "ApiRift" });
await checkPage("/pricing");
await checkHealth();

const summary = [
  `## Smoke test — ${mode} — ${base}`,
  ...passes.map((line) => `- ✅ ${line}`),
  ...failures.map((line) => `- ❌ ${line}`),
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + "\n");
}
console.log(summary);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
