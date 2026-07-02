import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function Day7TipEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="Share an impact report in a PR — your reviewer will thank you.">
      <Text style={styles.h1}>A power move for your next dependency PR</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        Every impact report you run has a shareable link. The underrated use:
        drop it into a pull request that bumps dependencies.
      </Text>
      <Text style={styles.text}>
        Instead of "bumped stripe to 17.x, should be fine", your PR carries a
        report showing exactly what changed upstream, what's deprecated, and
        what has a deadline. Reviews go faster because the risk is visible
        instead of vibes.
      </Text>
      <Link href={appUrl("/impact")} style={styles.button}>
        Run a report
      </Link>
      <Text style={styles.mono}>
        Reports are private until you share the link. Pro users can remove the
        Upstream footer from shared reports.
      </Text>
    </EmailShell>
  );
}
