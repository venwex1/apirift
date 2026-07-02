import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function UpgradePromptEmail({
  name,
  watchCount,
}: {
  name: string | null;
  watchCount: number;
}) {
  return (
    <EmailShell preview="The providers you can't watch are the ones that get you.">
      <Text style={styles.h1}>
        You're watching {watchCount} of {watchCount} — the rest of your stack
        is dark
      </Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        You've hit the free plan's watch limit, which means you chose which
        five providers deserve attention. The uncomfortable truth about
        dependency risk: it's usually the sixth one.
      </Text>
      <Text style={styles.text}>
        Pro watches everything you depend on, and it moves you from Monday
        digests to instant alerts — a breaking change reaches your inbox in
        minutes, with the affected surface and the action to take.
      </Text>
      <Link href={appUrl("/settings")} style={styles.buttonGreen}>
        Upgrade to Pro — $12/mo
      </Link>
      <Text style={styles.mono}>
        $115/year saves 20%. Cancel in two clicks, keep everything until the
        period ends.
      </Text>
    </EmailShell>
  );
}
