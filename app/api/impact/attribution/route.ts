import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";
import { PLAN_LIMITS } from "@/lib/plans";

const bodySchema = z.object({
  reportId: z.string().cuid(),
  shown: z.boolean(),
});

/**
 * The viral-loop valve. Attribution on shared reports is on by default;
 * hiding it is a paid perk — the upgrade incentive is the feature itself.
 */
export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Provide a report id and visibility.");
  }

  if (!parsed.data.shown && !PLAN_LIMITS[user.plan].canRemoveAttribution) {
    throw new AppError(
      ErrorCode.UPGRADE_REQUIRED,
      "Removing the Upstream badge from shared reports is a Pro feature."
    );
  }

  const updated = await db.impactReport.updateMany({
    where: { id: parsed.data.reportId, userId: user.id },
    data: { attributionShown: parsed.data.shown },
  });
  if (updated.count === 0) {
    throw new AppError(ErrorCode.NOT_FOUND, "That report doesn't exist.");
  }
  return NextResponse.json({ ok: true });
});
