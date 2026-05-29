import Link from "next/link";
import { loginPasswordAction } from "@/lib/actions/auth";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthEntryTabs } from "@/components/auth/auth-entry-tabs";
import { PasswordField } from "@/components/auth/password-field";
import { getSignupCountryOptions } from "@/lib/signup-countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    reset?: string;
    mode?: string;
    method?: string;
    cooldown?: string;
  }>;
}) {
  const { error, reset, mode, method } = await searchParams;
  const tenant = await getRequestTenant();
  const countries = await getSignupCountryOptions();
  const passwordMode = mode === "password";
  const defaultMethod = method === "email" ? "email" : "phone";

  return (
    <AuthLayout
      tenant={tenant}
      title={tenant ? `Sign in to ${tenant.brandName}` : "Sign in"}
      subtitle={
        passwordMode
          ? "Use your email or phone with password"
          : defaultMethod === "email"
            ? "Enter your email — we’ll text a code to your phone"
            : "Enter your mobile number — we’ll text you a code"
      }
      sideDescription={
        tenant
          ? "Send SMS campaigns, check delivery, and manage your wallet on your provider's branded portal."
          : "Sign in with phone or email. Quick SMS verification, no password needed."
      }
    >
      <AuthCard>
        <AuthAlert code={reset === "success" ? "reset" : error} />

        {passwordMode ? (
          <form action={loginPasswordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier-password">Email or phone</Label>
              <Input
                id="identifier-password"
                name="identifier"
                type="text"
                placeholder="you@email.com or +233 20 000 0001"
                required
                autoComplete="username"
                className="h-11"
              />
            </div>
            <PasswordField
              id="password"
              name="password"
              label="Password"
              showStrength={false}
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-primary font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold">
              Sign in with password
            </Button>
          </form>
        ) : (
          <AuthEntryTabs
            countries={countries}
            intent="login"
            defaultMethod={defaultMethod}
          />
        )}

        <div className="mt-6 pt-5 border-t border-border/50 space-y-3 text-center text-sm">
          {!passwordMode ? (
            <Link
              href="/login?mode=password"
              className="text-muted-foreground hover:text-primary font-medium"
            >
              Sign in with password instead
            </Link>
          ) : (
            <Link href="/login" className="text-primary font-medium hover:underline">
              ← Back to SMS code login
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
