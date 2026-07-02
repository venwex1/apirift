const faqs = [
  {
    question: "How is this different from a status page aggregator?",
    answer:
      "Status pages tell you something is down right now. Upstream's job is mostly about what breaks later: deprecations with dates, breaking API versions, SDK majors, policy changes. Incidents are included, but the valuable alerts are the ones that arrive weeks before the breakage window — while the fix is still a calm afternoon instead of a 2 a.m. rollback.",
  },
  {
    question: "How do you decide what's worth alerting me about?",
    answer:
      "Every entry is classified by kind (breaking, deprecation, incident, security, feature) and severity against the surface it touches. Instant alerts fire only for CRITICAL and HIGH severity on providers you watch. Everything else waits for your Monday digest. If your inbox gets noisy, that's a bug in our product, not a setting you forgot.",
  },
  {
    question: "What if the AI misclassifies something?",
    answer:
      "Every alert links the original source, so you're never trusting a summary blind. Entries the classifier can't confidently parse are shown unclassified rather than guessed at or dropped. Classification history is kept, so corrections improve the system for everyone watching that provider.",
  },
  {
    question: "Do you support providers that aren't in the registry?",
    answer:
      "The registry grows continuously, and additions ship to all users at once — request a provider by replying to any Upstream email with its changelog URL. Because monitoring is shared infrastructure, each new provider costs us one watcher and serves every user who needs it.",
  },
  {
    question: "What happens to my alerts if I cancel?",
    answer:
      "You drop to the free plan: 5 watched providers and the weekly digest. Your history, reports, and settings stay intact. Cancel is two clicks in the billing portal — no retention flow, no email asking you to reconsider.",
  },
  {
    question: "Is my package.json data private?",
    answer:
      "Impact analysis stores the dependency names needed for your report — never versions, never code, never anything else from your project. Reports are private unless you share the link, and shared reports can be deleted anytime.",
  },
];

export function Faq() {
  return (
    <dl className="divide-y divide-line">
      {faqs.map((faq) => (
        <div key={faq.question} className="py-5">
          <dt className="font-display text-sm font-semibold text-fg">{faq.question}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-fg-muted">{faq.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
