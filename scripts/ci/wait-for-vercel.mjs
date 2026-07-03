/**
 * Waits for the Vercel deployment of a specific commit to reach READY state
 * and prints its URL (also appends `url=` to $GITHUB_OUTPUT when present).
 *
 * Usage:
 *   node scripts/ci/wait-for-vercel.mjs --target=preview --sha=<commit-sha>
 *   node scripts/ci/wait-for-vercel.mjs --target=production --sha=<commit-sha>
 *
 * Env: VERCEL_TOKEN (required), VERCEL_PROJECT_ID (required),
 *      VERCEL_TEAM (slug, default umutalp8898-4118s-projects)
 *
 * Exits non-zero if the deployment errors or doesn't appear within 15 min —
 * which halts the checkpoint pipeline, per the quality-gate philosophy.
 */
import { appendFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  })
);

const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const team = process.env.VERCEL_TEAM ?? "umutalp8898-4118s-projects";
const target = args.target === "production" ? "production" : "preview";
const sha = args.sha;

if (!token || !projectId || !sha) {
  console.error("Missing VERCEL_TOKEN, VERCEL_PROJECT_ID, or --sha");
  process.exit(1);
}

const DEADLINE_MS = 15 * 60 * 1000;
const POLL_MS = 15_000;
const start = Date.now();

async function findDeployment() {
  const url = new URL("https://api.vercel.com/v6/deployments");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("target", target);
  url.searchParams.set("limit", "30");
  url.searchParams.set("slug", team);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Vercel API HTTP ${res.status}`);
  const body = await res.json();
  return (body.deployments ?? []).find(
    (deployment) => deployment.meta?.githubCommitSha === sha
  );
}

while (true) {
  let deployment;
  try {
    deployment = await findDeployment();
  } catch (err) {
    console.error(`Poll failed (will retry): ${err.message}`);
  }

  if (deployment) {
    const state = deployment.readyState ?? deployment.state;
    console.error(`Deployment ${deployment.uid}: ${state}`);
    if (state === "READY") {
      const url = `https://${deployment.url}`;
      console.log(url);
      if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `url=${url}\n`);
      }
      process.exit(0);
    }
    if (state === "ERROR" || state === "CANCELED") {
      console.error(`Deployment failed with state ${state} — halting pipeline.`);
      process.exit(1);
    }
  } else {
    console.error(`No ${target} deployment for ${sha.slice(0, 7)} yet…`);
  }

  if (Date.now() - start > DEADLINE_MS) {
    console.error("Timed out waiting for Vercel deployment (15 min).");
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}
