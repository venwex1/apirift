import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Shared email shell. Email clients get inline styles, dark-on-light for
 * deliverability (dark-background emails trip clipping and spam heuristics).
 * The brand carries through type, the signal-green rule, and voice.
 */
export const styles = {
  body: { backgroundColor: "#F7F8F9", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", margin: 0 },
  container: { backgroundColor: "#FFFFFF", border: "1px solid #E5E8ED", borderRadius: "12px", margin: "32px auto", maxWidth: "520px", padding: "32px" },
  rule: { backgroundColor: "#2EE6A8", borderRadius: "2px", height: "3px", width: "48px" },
  h1: { color: "#0B0E15", fontSize: "20px", fontWeight: 700, lineHeight: "28px", margin: "20px 0 0" },
  text: { color: "#3D4557", fontSize: "15px", lineHeight: "24px", margin: "14px 0 0" },
  mono: { color: "#5A6376", fontFamily: "'SF Mono', 'Courier New', monospace", fontSize: "12px", margin: "24px 0 0" },
  button: { backgroundColor: "#0B0E15", borderRadius: "8px", color: "#FFFFFF", display: "inline-block", fontSize: "14px", fontWeight: 600, marginTop: "24px", padding: "12px 20px", textDecoration: "none" },
  buttonGreen: { backgroundColor: "#1B8A67", borderRadius: "8px", color: "#FFFFFF", display: "inline-block", fontSize: "14px", fontWeight: 600, marginTop: "24px", padding: "12px 20px", textDecoration: "none" },
  footer: { color: "#8A94A6", fontSize: "12px", lineHeight: "18px", margin: "32px 0 0" },
  alertBox: { backgroundColor: "#FFF8EC", border: "1px solid #F5B84B", borderRadius: "8px", marginTop: "20px", padding: "16px" },
  breachBox: { backgroundColor: "#FFF0F0", border: "1px solid #FF5D5D", borderRadius: "8px", marginTop: "20px", padding: "16px" },
} as const;

export function appUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "https://upstream.watch"}${path}`;
}

export function EmailShell({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.rule} />
          {children}
          <Text style={styles.footer}>
            upstream — know before it breaks
            <br />
            You get these because you have an Upstream account.{" "}
            <Link href={appUrl("/settings")} style={{ color: "#8A94A6" }}>
              Manage emails
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function greeting(name: string | null): string {
  return name !== null && name.length > 0 ? `${name} —` : "Hey —";
}
