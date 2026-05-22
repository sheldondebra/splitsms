import { getSession } from "@/lib/auth/session";
import { getResellerByUserId } from "@/lib/reseller/context";
import { ResellerSidebar } from "@/components/reseller/reseller-sidebar";
import { redirect } from "next/navigation";

export default async function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "RESELLER" && !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/dashboard");
  }

  const reseller = await getResellerByUserId(session.userId);

  const primary = reseller?.branding?.primaryColor ?? "#f97316";
  const secondary = reseller?.branding?.secondaryColor ?? "#0f0f0f";

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-background"
      style={
        {
          "--reseller-primary": primary,
          "--reseller-sidebar": secondary,
        } as React.CSSProperties
      }
    >
      <ResellerSidebar
        brandName={reseller?.brandName ?? reseller?.businessName}
        primaryColor={primary}
      />
      <main className="flex-1 p-6 md:p-10 overflow-auto">{children}</main>
    </div>
  );
}
