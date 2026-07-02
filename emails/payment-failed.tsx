import { Link, Text, Section } from "@react-email/components";
import { EmailShell, styles, appUrl, greeting } from "./components";

export default function PaymentFailedEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="Your card didn't go through — nothing is lost, easy fix.">
      <Text style={styles.h1}>Your payment didn't go through</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        Your latest Upstream payment failed — usually an expired card or a
        bank being cautious. Nothing dramatic: your alerts are still running
        and nothing has been lost.
      </Text>
      <Text style={styles.text}>
        Stripe retries automatically over the next few days. To sort it now,
        update your card in the billing portal — it takes about a minute:
      </Text>
      <Link href={appUrl("/settings")} style={styles.button}>
        Update payment method
      </Link>
      <Section style={styles.alertBox}>
        <Text style={{ ...styles.text, margin: 0 }}>
          If the retries fail, your account moves to the free plan (5 watched
          providers, weekly digest). Your history and settings stay intact
          either way.
        </Text>
      </Section>
    </EmailShell>
  );
}
