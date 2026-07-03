/**
 * Sends an ops alert email to the founder via Resend — used by checkpoint 4
 * (production failure → rollback notification) and checkpoint 5 (monitor).
 *
 * Usage: node scripts/ci/send-alert.mjs --subject="…" --body="…"
 * Env: RESEND_API_KEY, EMAIL_FROM, FOUNDER_EMAIL (same values the app uses)
 *
 * Exits 0 even if the send fails after retries — an alerting failure must
 * not mask the original pipeline failure (the workflow step that calls this
 * is already in a failure path). The error is logged loudly instead.
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  })
);

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const to = process.env.FOUNDER_EMAIL;

if (!apiKey || !from || !to) {
  console.error("ALERT NOT SENT: RESEND_API_KEY / EMAIL_FROM / FOUNDER_EMAIL missing from env.");
  process.exit(0);
}

const subject = args.subject ?? "ApiRift alert";
const body = (args.body ?? "No details provided.").replace(/\\n/g, "\n");

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[ApiRift ops] ${subject}`,
        text: `${body}\n\n— automated alert from the ApiRift quality-gate pipeline`,
      }),
    });
    if (res.ok) {
      console.log("Alert email sent.");
      process.exit(0);
    }
    console.error(`Resend HTTP ${res.status} (attempt ${attempt}/3)`);
  } catch (err) {
    console.error(`Send failed (attempt ${attempt}/3): ${err.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
}
console.error("ALERT NOT SENT after 3 attempts — check Resend key/domain.");
process.exit(0);
