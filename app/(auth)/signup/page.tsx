import Link from "next/link";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { SignupForm } from "@/components/auth/signup-form";
import { getSignupCountryOptions } from "@/lib/signup-countries";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; method?: string }>;
}) {
  const { error, method } = await searchParams;
  const countries = await getSignupCountryOptions();
  const defaultMethod = method === "email" ? "email" : "phone";

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Global SMS delivery made simple · 5 free credits"
      sideBadge="5 FREE SMS credits on signup"
      sideTitle="Start sending bulk SMS today"
      sideDescription="Join teams across Ghana and 190+ countries using SplitSMS for campaigns, OTPs, and alerts."
    >
      <AuthCard>
        <AuthAlert code={error} />
        <SignupForm countries={countries} defaultMethod={defaultMethod} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
