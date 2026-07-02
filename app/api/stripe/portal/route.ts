import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withErrorHandling, AppError, ErrorCode } from "@/lib/errors";
import { createPortalSession } from "@/lib/stripe";

export const POST = withErrorHandling(async () => {
  const user = await requireUser();
  if (user.stripeCustomerId === null) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "No billing account yet — upgrade to a paid plan first."
    );
  }
  const url = await createPortalSession(user.stripeCustomerId);
  return NextResponse.json({ url });
});
