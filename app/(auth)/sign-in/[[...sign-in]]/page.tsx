import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
      <SignIn />
    </div>
  );
}
