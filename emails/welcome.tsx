import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function WelcomeEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="One paste and your whole stack is under watch.">
      <Text style={styles.h1}>Your stack is now being watched</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        Welcome to ApiRift. Here's the whole product in three lines:
      </Text>
      <Text style={styles.text}>
        • <strong>We read everything</strong> — changelogs, status pages, and
        deprecation notices for every API provider you watch, around the clock.
      </Text>
      <Text style={styles.text}>
        • <strong>You hear only what matters</strong> — breaking changes and
        deadlines become alerts; everything else waits for Monday's digest.
      </Text>
      <Text style={styles.text}>
        • <strong>Deadlines become countdowns</strong> — "sunsets March 1"
        turns into "41 days, here's the affected surface, here's what to do."
      </Text>
      <Text style={styles.text}>
        The fastest setup is one paste: drop your package.json into Impact and
        in ten seconds you'll see every breaking change and deprecation across
        your actual dependencies — and your stack is watched from then on.
      </Text>
      <Link href={appUrl("/impact")} style={styles.buttonGreen}>
        Paste your package.json
      </Link>
      <Text style={styles.text}>
        Or start from your{" "}
        <Link href={appUrl("/dashboard")} style={{ color: "#1B8A67" }}>
          dashboard
        </Link>{" "}
        and pick providers from the registry by hand.
      </Text>
      <Text style={styles.mono}>
        Setup time: ~60 seconds. Emails from us after this: only when your
        stack changes, plus a Monday digest.
      </Text>
    </EmailShell>
  );
}
