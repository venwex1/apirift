import { Link, Section, Text } from "@react-email/components";
import { EmailShell, styles, appUrl } from "./components";

interface InstantAlertProps {
  name: string | null;
  providerName: string;
  providerSlug: string;
  title: string;
  severity: string;
  summary: string;
  actionRequired: string | null;
  url: string | null;
}

export default function InstantAlertEmail({
  providerName,
  providerSlug,
  title,
  severity,
  summary,
  actionRequired,
  url,
}: InstantAlertProps) {
  const isCritical = severity === "CRITICAL";
  return (
    <EmailShell preview={`${providerName}: ${title}`}>
      <Text style={styles.mono}>
        {severity} · {providerName}
      </Text>
      <Text style={styles.h1}>{title}</Text>
      <Section style={isCritical ? styles.breachBox : styles.alertBox}>
        <Text style={{ ...styles.text, margin: 0 }}>{summary}</Text>
        {actionRequired !== null ? (
          <Text style={{ ...styles.text, fontWeight: 700, color: "#0B0E15" }}>
            Action: {actionRequired}
          </Text>
        ) : null}
      </Section>
      {url !== null ? (
        <Text style={styles.text}>
          Source:{" "}
          <Link href={url} style={{ color: "#1B8A67" }}>
            {url}
          </Link>
        </Text>
      ) : null}
      <Link href={appUrl(`/providers/${providerSlug}`)} style={styles.button}>
        View in Upstream
      </Link>
      <Text style={styles.mono}>
        You're getting this within minutes of publication because you watch{" "}
        {providerName} on a paid plan.
      </Text>
    </EmailShell>
  );
}
