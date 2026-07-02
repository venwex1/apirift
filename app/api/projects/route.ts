import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";
import { PLAN_LIMITS } from "@/lib/plans";

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  webhookUrl: z.string().url().max(500).optional(),
});

export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "A project needs a name (and a valid webhook URL if provided).");
  }

  const limits = PLAN_LIMITS[user.plan];
  if (parsed.data.webhookUrl !== undefined && !limits.webhooks) {
    throw new AppError(
      ErrorCode.UPGRADE_REQUIRED,
      "Outgoing webhooks are a Team feature."
    );
  }

  const count = await db.project.count({ where: { userId: user.id } });
  if (count >= limits.maxProjects) {
    throw new AppError(
      ErrorCode.LIMIT_REACHED,
      `You have ${count} of ${limits.maxProjects} projects on your current plan.`
    );
  }

  const project = await db.project.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      webhookUrl: parsed.data.webhookUrl ?? null,
    },
  });
  return NextResponse.json({ project }, { status: 201 });
});
