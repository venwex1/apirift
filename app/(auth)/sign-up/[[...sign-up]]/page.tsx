import { SignUp } from "@clerk/nextjs";
import { cookies } from "next/headers";

/**
 * Sign-up carries the referral code (set as a cookie by /r/... and landing
 * ?ref= links) into Clerk's unsafeMetadata, where the user.created webhook
 * reads it to record attribution.
 */
export default async function SignUpPage() {
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("upstream_ref")?.value;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
      <SignUp
        unsafeMetadata={referralCode !== undefined ? { referralCode } : undefined}
      />
    </div>
  );
}
