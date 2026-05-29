import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthEntryTabs } from "@/components/auth/auth-entry-tabs";
import { getSignupCountryOptions } from "@/lib/signup-countries";
import { getRequestTenant } from "@/lib/reseller/request-tenant";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; method?: string }>;
}) {
  const { error, method } = await searchParams;
  const tenant = await getRequestTenant();
  if (tenant) {
    redirect("/login?error=tenant_signup");
  }
  const countries = await getSignupCountryOptions();
  const defaultMethod = method === "email" ? "email" : "phone";

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        defaultMethod === "email"
          ? "Sign up with email — verify via SMS on your phone"
          : "Sign up with phone — we’ll verify you by SMS"
      }
      sideBadge="5 FREE SMS credits"
      sideTitle="Start sending bulk SMS today"
      sideDescription="Choose phone or email. One quick code and you’re ready to send."
    >
      <AuthCard>
        <AuthAlert code={error} />
        <AuthEntryTabs
          countries={countries}
          intent="signup"
          defaultMethod={defaultMethod}
        />
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
          By continuing you agree to receive a one-time SMS for verification. Message & data rates
          may apply.
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
