import { Text } from "@react-email/components";
import { EmailShell, styles, greeting } from "./components";

export default function Day14FeedbackEmail({ name }: { name: string | null }) {
  return (
    <EmailShell preview="One question — replies come straight to the founder.">
      <Text style={styles.h1}>One question about Upstream</Text>
      <Text style={styles.text}>{greeting(name)}</Text>
      <Text style={styles.text}>
        Two weeks in. One question, and a real answer helps more than you'd
        think:
      </Text>
      <Text style={{ ...styles.text, fontWeight: 700, color: "#0B0E15" }}>
        What almost stopped you from using Upstream?
      </Text>
      <Text style={styles.text}>
        Hit reply — it goes straight to the founder's inbox, not a ticket
        queue. One sentence is plenty. Blunt is better.
      </Text>
      <Text style={styles.mono}>
        (And if the answer is "nothing, it's working" — that's useful too.)
      </Text>
    </EmailShell>
  );
}
