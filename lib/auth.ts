import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { generateReferralCode } from "@/lib/referral";

/**
 * Returns the app User for the current Clerk session, creating the row if the
 * Clerk webhook hasn't landed yet (webhooks are at-least-once, not instant).
 * Throws UNAUTHORIZED when there is no session.
 */
export async function requireUser(): Promise<User> {
  const { userId } = await auth();
  if (userId === null) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Sign in to continue.");
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (existing !== null) {
    // Touch activity at most once an hour to avoid write amplification.
    if (Date.now() - existing.lastActiveAt.getTime() > 60 * 60 * 1000) {
      await db.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
    }
    return existing;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (email === undefined) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Your account has no email address. Contact support."
    );
  }

  return db.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email,
      name: clerkUser?.firstName ?? null,
      referralCode: generateReferralCode(),
    },
  });
}

/** Nullable variant for pages that render differently when signed out. */
export async function maybeUser(): Promise<User | null> {
  const { userId } = await auth();
  if (userId === null) return null;
  return db.user.findUnique({ where: { id: userId } });
}
