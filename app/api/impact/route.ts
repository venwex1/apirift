import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";
import { parseManifest, analyzeImpact, findingsToJson } from "@/lib/impact";
import { consumeMonthlyMetric } from "@/lib/usage";
import { track } from "@/lib/analytics";
import { appUrl } from "@/lib/utils";

const bodySchema = z.object({
  manifestJson: z.string().min(2).max(200_000),
  projectId: z.string().cuid().optional(),
});

/**
 * The "first five minutes" feature: paste a package.json, get back every
 * recent breaking change, deprecation, and incident across your actual stack.
 * Deterministic (registry match + DB scan) — no AI in the request path.
 */
export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Paste the contents of a package.json.");
  }

  if (parsed.data.projectId !== undefined) {
    const project = await db.project.findFirst({
      where: { id: parsed.data.projectId, userId: user.id },
      select: { id: true },
    });
    if (project === null) {
      throw new AppError(ErrorCode.NOT_FOUND, "That project doesn't exist.");
    }
  }

  const packageNames = parseManifest(parsed.data.manifestJson);
  await consumeMonthlyMetric(user.id, user.plan, "impact_reports");
  const analysis = await analyzeImpact(packageNames);

  const report = await db.impactReport.create({
    data: {
      userId: user.id,
      projectId: parsed.data.projectId ?? null,
      manifest: { packages: packageNames },
      matchedProviders: analysis.matchedProviders.map((match) => match.slug),
      findings: findingsToJson(analysis.findings),
      attributionShown: true,
    },
  });

  if (parsed.data.projectId !== undefined) {
    await db.project.update({
      where: { id: parsed.data.projectId },
      data: { manifest: { packages: packageNames } },
    });
  }

  track(user.id, "impact_report_created", {
    providers: analysis.matchedProviders.length,
    findings: analysis.findings.length,
  });

  return NextResponse.json(
    {
      report: {
        id: report.id,
        publicId: report.publicId,
        matchedProviders: analysis.matchedProviders,
        unmatchedPackages: analysis.unmatchedPackages,
        findings: analysis.findings,
      },
      publicUrl: appUrl(`/r/${report.publicId}`),
    },
    { status: 201 }
  );
});
