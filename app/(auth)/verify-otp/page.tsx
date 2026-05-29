import Link from "next/link";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { OtpForm } from "@/components/auth/otp-form";
import { getOtpResendCooldownSec } from "@/lib/auth/otp";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import type { OtpPurpose } from "@/lib/generated/prisma/client";

const purposeMap: Record<string, OtpPurpose> = {
  signup: "SIGNUP_VERIFY",
  login: "LOGIN",
  reset: "PASSWORD_RESET",
};

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{
    phone?: string;
    purpose?: string;
    error?: string;
    msg?: string;
    resent?: string;
    cooldown?: string;
    country?: string;
    returnTo?: string;
    via?: string;
    hint?: string;
    delivery?: string;
  }>;
}) {
  const params = await searchParams;
  const phone = params.phone ?? "";
  const purpose = params.purpose ?? "signup";
  const countryCode = params.country ?? "GH";

  if (!phone) {
    return (
      <AuthLayout title="Verification" subtitle="Missing phone number">
        <AuthCard>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Return to login
            </Link>
          </p>
        </AuthCard>
      </AuthLayout>
    );
  }

  const tenant = await getRequestTenant();
  const otpPurpose = purposeMap[purpose] ?? "SIGNUP_VERIFY";
  const cooldownFromDb = await getOtpResendCooldownSec(phone, otpPurpose);
  const cooldown = Math.max(
    cooldownFromDb,
    params.cooldown ? parseInt(params.cooldown, 10) : 0,
  );

  const titles: Record<string, string> = {
    signup: "Enter your code",
    login: "Enter your code",
    reset: "Enter reset code",
  };

  return (
    <AuthLayout
      tenant={tenant}
      title={titles[purpose] ?? "Enter verification code"}
      subtitle={`Code sent to ${phone}`}
      sideDescription={
        tenant
          ? `Never share your code. ${tenant.brandName} support will never ask for it.`
          : "Never share your code. SplitSMS staff will never ask for it."
      }
    >
      <AuthCard>
        <OtpForm
          phone={phone}
          purpose={purpose}
          countryCode={countryCode}
          error={params.error}
          message={params.msg}
          resent={params.resent === "1"}
          initialCooldown={cooldown}
          returnTo={
            params.returnTo?.startsWith("/dashboard") ? params.returnTo : undefined
          }
          viaEmail={params.via === "email"}
          delivery={params.delivery ?? (params.via === "email" ? "sms" : "sms")}
          phoneHint={params.hint ? decodeURIComponent(params.hint) : undefined}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href={
              params.returnTo?.startsWith("/dashboard") ? params.returnTo : "/login"
            }
            className="text-primary font-medium hover:underline"
          >
            ←{" "}
            {params.returnTo?.startsWith("/dashboard") ? "Back to settings" : "Back to login"}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
