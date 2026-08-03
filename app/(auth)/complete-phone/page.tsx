import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { CompletePhoneForm } from "@/components/auth/complete-phone-form";
import { getGooglePendingCookie } from "@/lib/auth/google";
import { getSignupCountryOptions } from "@/lib/signup-countries";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { authPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = authPageMetadata(
  "/complete-phone",
  "Add phone number",
  "Add and verify your phone number to finish Google sign-up on SplitSMS.",
);

export default async function CompletePhonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const pending = await getGooglePendingCookie();
  if (!pending) {
    redirect("/login?error=google_session");
  }

  const { error } = await searchParams;
  const tenant = await getRequestTenant();
  const countries = await getSignupCountryOptions();

  return (
    <AuthLayout
      tenant={tenant}
      title="Verify your phone"
      subtitle="Google sign-in works — add a mobile number to finish setup"
      sideDescription="SplitSMS uses your phone for SMS delivery, OTP verification, and account recovery."
    >
      <AuthCard>
        <AuthAlert code={error} />
        <CompletePhoneForm countries={countries} email={pending.email} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not you?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Start over
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
