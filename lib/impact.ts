import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

/**
 * Impact analysis: deterministic mapping from a pasted package.json to the
 * provider registry, then a scan of recent classified changes for those
 * providers. No LLM in this path — it must be instant, free, and exact.
 */

const manifestSchema = z.object({
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
});

export interface ImpactFinding {
  providerSlug: string;
  providerName: string;
  changeId: string;
  title: string;
  kind: string;
  severity: string;
  summary: string | null;
  effectiveAt: string | null;
  url: string | null;
}

export interface ImpactAnalysis {
  matchedProviders: { slug: string; name: string; viaPackages: string[] }[];
  unmatchedPackages: string[];
  findings: ImpactFinding[];
}

const LOOKBACK_DAYS = 90;

export function parseManifest(manifestJson: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new AppError(
      ErrorCode.VALIDATION,
      "That doesn't parse as JSON. Paste your package.json contents exactly."
    );
  }
  const result = manifestSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(
      ErrorCode.VALIDATION,
      "Expected a package.json with a dependencies field."
    );
  }
  const names = [
    ...Object.keys(result.data.dependencies ?? {}),
    ...Object.keys(result.data.devDependencies ?? {}),
  ];
  if (names.length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION,
      "No dependencies found in that manifest."
    );
  }
  return [...new Set(names)];
}

export async function analyzeImpact(packageNames: string[]): Promise<ImpactAnalysis> {
  const providers = await db.provider.findMany({
    where: { npmPackages: { hasSome: packageNames } },
    select: { id: true, slug: true, name: true, npmPackages: true },
  });

  const matchedPackages = new Set<string>();
  const matchedProviders = providers.map((provider) => {
    const viaPackages = provider.npmPackages.filter((pkg) =>
      packageNames.includes(pkg)
    );
    for (const pkg of viaPackages) matchedPackages.add(pkg);
    return { slug: provider.slug, name: provider.name, viaPackages };
  });

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const changes = await db.change.findMany({
    where: {
      providerId: { in: providers.map((provider) => provider.id) },
      status: "CLASSIFIED",
      severity: { in: ["CRITICAL", "HIGH", "MEDIUM"] },
      createdAt: { gte: since },
    },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 50,
    include: { provider: { select: { slug: true, name: true } } },
  });

  return {
    matchedProviders,
    unmatchedPackages: packageNames.filter((pkg) => !matchedPackages.has(pkg)),
    findings: changes.map((change) => ({
      providerSlug: change.provider.slug,
      providerName: change.provider.name,
      changeId: change.id,
      title: change.title,
      kind: change.kind ?? "NOTICE",
      severity: change.severity ?? "INFO",
      summary: change.summary,
      effectiveAt: change.effectiveAt?.toISOString() ?? null,
      url: change.url,
    })),
  };
}

/** Serializes findings for the ImpactReport.findings Json column. */
export function findingsToJson(findings: ImpactFinding[]): Prisma.InputJsonValue {
  return findings.map((finding) => ({ ...finding }));
}
