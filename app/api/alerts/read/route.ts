import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";

const bodySchema = z.object({ alertIds: z.array(z.string().cuid()).min(1).max(200) });

export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new AppError(ErrorCode.VALIDATION, "Provide alert ids to mark read.");
  }
  await db.alert.updateMany({
    where: { id: { in: parsed.data.alertIds }, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
});
