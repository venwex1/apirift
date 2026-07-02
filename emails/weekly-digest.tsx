import { Link, Section, Text } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export interface DigestChange {
  providerName: string;
  providerSlug: string;
  title: string;
  kind: string;
  severity: string;
  summary: string;
  url: string | null;
}

interface WeeklyDigestProps {
  name: string | null;
  changes: DigestChange[];
  isFreePlan: boolean;
}

export default function WeeklyDigestEmail({
  name,
  changes,
  isFreePlan,
}: WeeklyDigestProps) {
  const urgent = changes.filter(
    (change) => change.severity === "CRITICAL" || change.severity === "HIGH"
  );
  const rest = changes.filter(
    (change) => change.severity !== "CRITICAL" && change.severity !== "HIGH"
  );

  return (
    <EmailShell
      preview={
        changes.length === 0
          ? "All quiet across your stack this week."
          : `${changes.length} changes across your stack, ${urgent.length} worth acting on.`
      }
    >
      <Text style={styles.h1}>
        {changes.length === 0
          ? "All quiet this week"
          : `Your stack this week: ${changes.length} changes`}
      </Text>
      <Text style={styles.text}>{greeting(name)}</Text>

      {changes.length === 0 ? (
        <Text style={styles.text}>
          Nothing notable happened across your watched providers this week. No
          breaking changes, no deprecations, no incidents. This email exists
          so silence is information, not uncertainty.
        </Text>
      ) : (
        <>
          {urgent.length > 0 ? (
            <Section style={styles.alertBox}>
              <Text style={{ ...styles.text, margin: 0, fontWeight: 700, color: "#0B0E15" }}>
                Needs attention
              </Text>
              {urgent.map((change) => (
                <Text key={`${change.providerSlug}-${change.title}`} style={styles.text}>
                  <strong>{change.providerName}</strong> · {change.severity} —{" "}
                  {change.url !== null ? (
                    <Link href={change.url} style={{ color: "#1B8A67" }}>
                      {change.title}
                    </Link>
                  ) : (
                    change.title
                  )}
                  <br />
                  {change.summary}
                </Text>
              ))}
            </Section>
          ) : null}
          {rest.length > 0 ? (
            <>
              <Text style={{ ...styles.text, fontWeight: 700, color: "#0B0E15" }}>
                Also this week
              </Text>
              {rest.slice(0, 10).map((change) => (
                <Text key={`${change.providerSlug}-${change.title}`} style={styles.text}>
                  <strong>{change.providerName}</strong> ({change.kind.toLowerCase()}) —{" "}
                  {change.title}
                </Text>
              ))}
            </>
          ) : null}
        </>
      )}

      <Link href={appUrl("/dashboard")} style={styles.button}>
        Open your signal
      </Link>

      {isFreePlan && urgent.length > 0 ? (
        <Text style={styles.mono}>
          Heads up: on the free plan these landed in Monday's digest. Pro
          users had them in their inbox within minutes of publication.
        </Text>
      ) : null}
    </EmailShell>
  );
}
