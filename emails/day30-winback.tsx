import { Link, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function Day30WinbackEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="Your dependencies kept shipping while you were gone.">
      <Text style={styles.h1}>Your stack changed while you were away</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        You haven't been back in a few weeks — no guilt, products get busy.
        But your dependencies didn't pause. Providers kept shipping changes,
        and some of them come with deadlines that don't care whether anyone
        was reading.
      </Text>
      <Text style={styles.text}>
        Sixty seconds on your dashboard shows everything that happened
        upstream since you left, sorted by severity. If it's all green, close
        the tab with a clear conscience.
      </Text>
      <Link href={appUrl("/dashboard")} style={styles.button}>
        See what changed
      </Link>
      <Text style={styles.mono}>
        If Upstream isn't useful to you, that's fine too — no hard feelings,
        and your account costs nothing to leave dormant.
      </Text>
    </EmailShell>
  );
}
