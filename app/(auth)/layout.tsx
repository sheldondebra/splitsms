import type { Metadata } from "next";
import { AuthCaptchaProvider } from "@/components/auth/auth-captcha-provider";
import { TenantThemeWrap } from "@/components/tenant/tenant-theme";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import { publicCaptchaConfig } from "@/lib/auth/signup-guard-shared";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getRequestTenant();
  const captcha = publicCaptchaConfig();
  return (
    <TenantThemeWrap tenant={tenant}>
      <AuthCaptchaProvider config={captcha}>{children}</AuthCaptchaProvider>
    </TenantThemeWrap>
  );
}
