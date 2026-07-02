import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "@/lib/env";
import { withRetry } from "@/lib/errors";
import { consumeAiBudget } from "@/lib/redis";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * Classification model: Haiku. This is deliberate — classification is a
 * bounded extraction task over a short excerpt, and Haiku's cost profile is
 * what makes "read every changelog on the internet" economically absurd for
 * a human and trivial for this product.
 */
const MODEL = "claude-haiku-4-5";
const MAX_EXCERPT_CHARS = 6000;

export const classificationSchema = z.object({
  kind: z.enum([
    "BREAKING",
    "DEPRECATION",
    "INCIDENT",
    "SECURITY",
    "FEATURE",
    "MAINTENANCE",
    "NOTICE",
  ]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
  summary: z.string().min(1).max(500),
  affectedSurfaces: z.array(z.string().max(80)).max(8),
  actionRequired: z.string().max(500).nullable(),
  effectiveAt: z.string().nullable(), // ISO date if a deadline is stated
});

export type Classification = z.infer<typeof classificationSchema>;

export type ClassifyResult =
  | { ok: true; classification: Classification }
  | { ok: false; reason: "budget" | "unavailable" | "unparseable" };

const SYSTEM_PROMPT = `You classify changelog entries and status updates from API providers for developers who build on those APIs.

Rules:
- BREAKING: removes or changes behavior existing integrations rely on.
- DEPRECATION: announces future removal. If a date is stated, put it in effectiveAt (ISO 8601).
- INCIDENT: outage or degradation. SECURITY: vulnerability or forced credential rotation.
- FEATURE/MAINTENANCE/NOTICE: additive, scheduled, or policy/pricing changes.
- severity CRITICAL only when existing production integrations break without action.
- summary: one or two plain sentences a busy developer reads in five seconds. Name the concrete API surface.
- affectedSurfaces: short names of the endpoints/SDKs/features touched.
- actionRequired: the specific thing a developer must do, or null.
Respond with ONLY a JSON object matching the schema. No prose, no markdown fences.`;

/**
 * Classifies one change. Never throws — every failure mode is a typed result
 * so callers decide policy (retry later, mark FAILED, etc.).
 */
export async function classifyChange(input: {
  providerName: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
}): Promise<ClassifyResult> {
  const withinBudget = await consumeAiBudget();
  if (!withinBudget) return { ok: false, reason: "budget" };

  let raw: string;
  try {
    const message = await withRetry(
      () =>
        anthropic.messages.create({
          model: MODEL,
          max_tokens: 700,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: JSON.stringify({
                provider: input.providerName,
                title: input.title,
                publishedAt: input.publishedAt,
                excerpt: input.excerpt.slice(0, MAX_EXCERPT_CHARS),
              }),
            },
          ],
        }),
      { attempts: 3, baseDelayMs: 1000, timeoutMs: 30_000, label: "anthropic.classify" }
    );
    const block = message.content[0];
    if (block === undefined || block.type !== "text") {
      return { ok: false, reason: "unparseable" };
    }
    raw = block.text;
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    return { ok: false, reason: "unparseable" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return { ok: false, reason: "unparseable" };
  }

  const result = classificationSchema.safeParse(parsed);
  if (!result.success) return { ok: false, reason: "unparseable" };
  return { ok: true, classification: result.data };
}
