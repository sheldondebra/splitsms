import Link from "next/link";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthEntryTabs } from "@/components/auth/auth-entry-tabs";
import { LoginPasswordForm } from "@/components/auth/login-password-form";
import { LoginPhonePasswordForm } from "@/components/auth/login-phone-password-form";
import { getSignupCountryOptions } from "@/lib/signup-countries";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    reset?: string;
    mode?: string;
    method?: string;
    phone?: string;
    email?: string;
    cooldown?: string;
    retry?: string;
  }>;
}) {
  const params = await searchParams;
  const { error, reset, mode, method, phone, email } = params;
  const tenant = await getRequestTenant();
  const countries = await getSignupCountryOptions();

  const smsMode = mode === "sms";
  const phonePasswordMode = mode === "password" && phone === "1";

  return (
    <AuthLayout
      tenant={tenant}
      title={tenant ? `Sign in to ${tenant.brandName}` : "Sign in"}
      subtitle={
        smsMode
          ? "We’ll send a one-time code to your phone or email"
          : phonePasswordMode
            ? "Use your phone number and password"
            : "Enter your email and password"
      }
      sideDescription={
        tenant
          ? "Send SMS campaigns, check delivery, and manage your wallet on your provider's branded portal."
          : "Sign in with email and password, or use a quick SMS code if you prefer."
      }
    >
      <AuthCard>
        <AuthAlert code={reset === "success" ? "reset" : error} />

        {smsMode ? (
          <AuthEntryTabs
            countries={countries}
            intent="login"
            defaultMethod={method === "phone" ? "phone" : "email"}
          />
        ) : phonePasswordMode ? (
          <LoginPhonePasswordForm />
        ) : (
          <LoginPasswordForm defaultEmail={email} />
        )}

        <div className="mt-6 pt-5 border-t border-border/50 space-y-3 text-center text-sm">
          {!smsMode ? (
            <Link
              href="/login?mode=sms"
              className="text-muted-foreground hover:text-primary font-medium"
            >
              Sign in with SMS code instead
            </Link>
          ) : (
            <Link href="/login" className="text-primary font-medium hover:underline">
              ← Sign in with email & password
            </Link>
          )}

          {!tenant && (
            <p className="text-muted-foreground">
              New here?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Create free account
              </Link>
            </p>
          )}

          {tenant?.supportEmail && (
            <p className="text-xs text-muted-foreground">
              Need an account? Contact{" "}
              <a
                href={`mailto:${tenant.supportEmail}`}
                className="text-primary font-medium hover:underline"
              >
                {tenant.supportEmail}
              </a>
            </p>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
