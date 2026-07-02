import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";
import { PLAN_LIMITS } from "@/lib/plans";
import { track } from "@/lib/analytics";

const bodySchema = z.object({ providerSlug: z.string().min(1).max(100) });

export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Provide a provider to watch.");
  }

  const provider = await db.provider.findUnique({
    where: { slug: parsed.data.providerSlug },
  });
  if (provider === null) {
    throw new AppError(ErrorCode.NOT_FOUND, "That provider isn't in the registry yet.");
  }

  const limit = PLAN_LIMITS[user.plan].maxWatches;
  const count = await db.watch.count({ where: { userId: user.id } });
  if (count >= limit) {
    throw new AppError(
      ErrorCode.LIMIT_REACHED,
      `You're watching ${count} of ${limit} providers on the free plan.`
    );
  }

  try {
    const watch = await db.watch.create({
      data: { userId: user.id, providerId: provider.id },
    });
    track(user.id, "watch_added", { provider: provider.slug });
    return NextResponse.json({ watch }, { status: 201 });
  } catch {
    throw new AppError(ErrorCode.ALREADY_EXISTS, "You're already watching this provider.");
  }
});

export const DELETE = withErrorHandling(async (req) => {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Provide a provider to unwatch.");
  }

  const provider = await db.provider.findUnique({
    where: { slug: parsed.data.providerSlug },
    select: { id: true, slug: true },
  });
  if (provider === null) {
    throw new AppError(ErrorCode.NOT_FOUND, "Unknown provider.");
  }

  const deleted = await db.watch.deleteMany({
    where: { userId: user.id, providerId: provider.id },
  });
  if (deleted.count === 0) {
    throw new AppError(ErrorCode.NOT_FOUND, "You weren't watching this provider.");
  }
  track(user.id, "watch_removed", { provider: provider.slug });
  return NextResponse.json({ ok: true });
});
