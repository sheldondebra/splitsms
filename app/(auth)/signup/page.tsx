import Link from "next/link";
import type { Metadata } from "next";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthEntryTabs } from "@/components/auth/auth-entry-tabs";
import {
  GoogleAuthButton,
  GoogleAuthDivider,
} from "@/components/auth/google-auth-button";
import { getSignupCountryOptions } from "@/lib/signup-countries";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { recordInviteLinkView } from "@/lib/reseller/invite-analytics";
import { resolveResellerInvite } from "@/lib/reseller/invite";
import { authPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = authPageMetadata(
  "/signup",
  "Create account",
  "Sign up for SplitSMS — send bulk SMS in Ghana and 190+ countries with 5 free starter credits.",
);

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; method?: string; r?: string; from?: string }>;
}) {
  const { error, method, r, from } = await searchParams;
  const hostTenant = await getRequestTenant();
  const inviteTenant = hostTenant ? null : await resolveResellerInvite(r);
  const tenant = hostTenant ?? inviteTenant;

  if (hostTenant) {
    await recordInviteLinkView(hostTenant.resellerId, "domain");
  } else if (r?.trim() && from !== "join") {
    const invite = inviteTenant ?? (await resolveResellerInvite(r));
    if (invite) {
      await recordInviteLinkView(invite.resellerId, "share");
    }
  }

  const countries = await getSignupCountryOptions();
  const defaultMethod = method === "email" ? "email" : "phone";
  const inviteParam = r?.trim() || undefined;

  return (
    <AuthLayout
      tenant={tenant}
      title={tenant ? `Create your ${tenant.brandName} account` : "Create your account"}
      subtitle={
        tenant
          ? defaultMethod === "email"
            ? "Sign up with email — verify via SMS on your phone"
            : "Sign up with phone — we’ll verify you by SMS"
          : defaultMethod === "email"
            ? "Sign up with email — verify via SMS on your phone"
            : "Sign up with phone — we’ll verify you by SMS"
      }
      sideBadge={tenant ? undefined : "5 FREE SMS credits"}
      sideTitle={
        tenant ? (
          <>
            Join <span style={{ color: tenant.primaryColor }}>{tenant.brandName}</span>
          </>
        ) : (
          "Start sending bulk SMS today"
        )
      }
      sideDescription={
        tenant
          ? "Create an account to send SMS campaigns, check delivery, and manage your wallet."
          : "Choose phone or email. One quick code and you’re ready to send."
      }
    >
      <AuthCard>
        <AuthAlert code={error} />
        <GoogleAuthButton resellerInvite={inviteParam} />
        <GoogleAuthDivider />
        <AuthEntryTabs
          countries={countries}
          intent="signup"
          defaultMethod={defaultMethod}
          resellerInvite={inviteParam}
        />
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
          By continuing you agree to receive a one-time SMS for verification. Message & data rates
          may apply.
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login?mode=sms" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
