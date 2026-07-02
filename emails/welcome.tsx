import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function WelcomeEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="One paste and your whole stack is under watch.">
      <Text style={styles.h1}>Your stack is now being watched</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        Upstream is simple: you tell it what your product is built on, and it
        tells you when any of it is about to change underneath you.
      </Text>
      <Text style={styles.text}>
        The fastest setup is one paste. Open Impact, drop in your
        package.json, and in ten seconds you'll see every breaking change,
        deprecation, and incident across your actual dependencies from the
        last 90 days — plus everything gets watched going forward.
      </Text>
      <Link href={appUrl("/impact")} style={styles.buttonGreen}>
        Paste your package.json
      </Link>
      <Text style={styles.text}>
        Prefer to pick by hand? The registry has every watched provider:{" "}
        <Link href={appUrl("/providers")} style={{ color: "#1B8A67" }}>
          browse the registry
        </Link>
        .
      </Text>
      <Text style={styles.mono}>
        Setup time: ~60 seconds. Emails from us after this: only when your
        stack changes, plus a Monday digest.
      </Text>
    </EmailShell>
  );
}
