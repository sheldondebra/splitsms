import { getSession } from "@/lib/auth/session";
import { getResellerByUserId } from "@/lib/reseller/context";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { ResellerAppShell } from "@/components/reseller/reseller-app-shell";
import { ResellerImpersonationBanner } from "@/components/reseller/reseller-impersonation-banner";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await getResellerByUserId(session.userId);

  if (!["ADMIN", "SUPER_ADMIN", "RESELLER"].includes(session.role) && !reseller) {
    redirect("/dashboard");
  }

  const [user, balance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phone: true, role: true },
    }),
    getBalanceSnapshot(session.userId),
  ]);

  const primary = reseller?.branding?.primaryColor ?? "#f97316";
  const secondary = reseller?.branding?.secondaryColor ?? "#0f0f0f";
  const impersonating = Boolean(session.impersonatorId);

  return (
    <div
      style={
        {
          "--reseller-primary": primary,
          "--reseller-sidebar": secondary,
        } as React.CSSProperties
      }
    >
      {impersonating ? (
        <ResellerImpersonationBanner
          businessName={
            session.impersonatedBusinessName ?? reseller?.businessName ?? "Partner"
          }
        />
      ) : null}
      <ResellerAppShell
        brandName={reseller?.brandName ?? reseller?.businessName}
        logoUrl={reseller?.branding?.logoUrl}
        primaryColor={primary}
        hideNav={reseller?.status !== "APPROVED"}
        balance={balance}
        profile={{
          fullName: user?.fullName ?? "Reseller",
          email: user?.email ?? null,
          phone: user?.phone ?? session.phone,
          role: user?.role ?? session.role,
        }}
      >
        {children}
      </ResellerAppShell>
    </div>
  );
}
