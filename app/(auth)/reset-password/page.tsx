import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions/auth";
import { getPasswordResetSession } from "@/lib/auth/reset-session";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { authPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = authPageMetadata(
  "/reset-password",
  "Reset password",
  "Choose a new password for your SplitSMS account.",
);

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const reset = await getPasswordResetSession();
  if (!reset) redirect("/forgot-password?error=session");

  const { error } = await searchParams;

  return (
    <AuthLayout
      title="Set new password"
      subtitle={`Choose a strong password for ${reset.phone}`}
      sideDescription="Your new password is encrypted and never stored in plain text."
    >
      <AuthCard>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        <AuthAlert code={error} />

        <form action={resetPasswordAction} className="space-y-4">
          <PasswordField
            id="password"
            name="password"
            label="New password"
            showStrength
            autoComplete="new-password"
          />
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full font-semibold">
            Update password
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {reset.returnTo ? (
            <Link href={reset.returnTo} className="text-primary font-medium hover:underline">
              ← Back to settings
            </Link>
          ) : (
            <Link href="/login" className="text-primary font-medium hover:underline">
              ← Back to login
            </Link>
          )}
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
