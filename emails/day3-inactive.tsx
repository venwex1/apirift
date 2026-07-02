import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function Day3InactiveEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="The whole setup is one paste. Ten seconds.">
      <Text style={styles.h1}>One paste. That's the whole setup.</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        You signed up but haven't added anything to watch yet — which usually
        means the setup looked like work. It isn't. It's one paste:
      </Text>
      <Text style={styles.text}>
        Copy your package.json. Paste it into Impact. Ten seconds later you
        have a report of every breaking change and deprecation across your
        actual dependencies — and your stack is watched from then on.
      </Text>
      <Link href={appUrl("/impact")} style={styles.buttonGreen}>
        Paste it now
      </Link>
      <Text style={styles.mono}>
        No config, no agents to install, nothing to maintain. That's the point.
      </Text>
    </EmailShell>
  );
}
