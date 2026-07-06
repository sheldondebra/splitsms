import Link from "next/link";
import type { Metadata } from "next";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import { authPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = authPageMetadata(
  "/forgot-password",
  "Forgot password",
  "Reset your SplitSMS account password via SMS or email verification.",
);

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; cooldown?: string }>;
}) {
  const { error, sent, cooldown } = await searchParams;
  const tenant = await getRequestTenant();

  return (
    <AuthLayout
      tenant={tenant}
      title="Forgot password?"
      subtitle="We'll send a secure code to your registered phone"
      sideTitle={
        <>
          Account recovery with <span className="text-primary">SMS verification</span>
        </>
      }
      sideDescription="For your security, reset codes are sent only to the phone number on your account."
    >
      <AuthCard>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        </div>

        <AuthAlert code={sent === "1" ? "sent" : error} />
        {cooldown && error === "cooldown" && (
          <AuthAlert
            code="cooldown"
            message={`Wait ${cooldown} seconds before requesting another code.`}
          />
        )}

        <form action={forgotPasswordAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Phone or email</Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="+233... or you@email.com"
              required
              autoComplete="username"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the phone or email linked to your account. If it exists, you&apos;ll receive a
            6-digit SMS code within seconds.
          </p>
          <Button type="submit" className="w-full font-semibold">
            Send reset code
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
