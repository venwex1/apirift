import { db } from "@/lib/db";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no lookalikes

export function generateReferralCode(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const byte of bytes) {
    code += ALPHABET.charAt(byte % ALPHABET.length);
  }
  return code;
}

const MIN_REFERRER_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Records a referral relationship at signup time.
 * Anti-abuse: referrer account must be ≥24h old, self-referral impossible
 * (code lookup excludes the new user), one Referral row per referred user
 * enforced by the unique constraint on referredId.
 */
export async function recordReferral(
  newUserId: string,
  referralCode: string
): Promise<void> {
  const referrer = await db.user.findUnique({
    where: { referralCode },
    select: { id: true, createdAt: true },
  });
  if (referrer === null || referrer.id === newUserId) return;
  if (Date.now() - referrer.createdAt.getTime() < MIN_REFERRER_ACCOUNT_AGE_MS) {
    return;
  }
  try {
    await db.$transaction([
      db.referral.create({
        data: { referrerId: referrer.id, referredId: newUserId },
      }),
      db.user.update({
        where: { id: newUserId },
        data: { referredById: referrer.id },
      }),
    ]);
  } catch {
    // Unique violation = referral already recorded. Idempotent by design.
  }
}
