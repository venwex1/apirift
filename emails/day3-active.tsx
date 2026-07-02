import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function Day3ActiveEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="Deadline countdowns — the feature most users find a month in.">
      <Text style={styles.h1}>The feature most users find on day 30</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        You've added your first watches — good. Here's the thing most people
        discover late: when a provider announces a deprecation with a date,
        Upstream turns it into a countdown against your stack.
      </Text>
      <Text style={styles.text}>
        "The legacy signature scheme sunsets August 12" becomes "41 days,
        affects webhook signatures, here's the migration step." That number
        ticks down on your dashboard until you've dealt with it.
      </Text>
      <Text style={styles.text}>
        Deadlines you can see don't become incidents. Check whether your stack
        has any live countdowns right now:
      </Text>
      <Link href={appUrl("/dashboard")} style={styles.button}>
        Open your signal
      </Link>
    </EmailShell>
  );
}
