import { getSession } from "@/lib/auth/session";
import { getEnterpriseByUserId } from "@/lib/enterprise/context";
import { EnterpriseSidebar } from "@/components/enterprise/enterprise-sidebar";
import { redirect } from "next/navigation";

export default async function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (
    session.role !== "ENTERPRISE" &&
    !["ADMIN", "SUPER_ADMIN"].includes(session.role)
  ) {
    redirect("/dashboard");
  }

  const enterprise = await getEnterpriseByUserId(session.userId);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <EnterpriseSidebar companyName={enterprise?.companyName} />
      <main className="flex-1 p-6 md:p-10 overflow-auto">{children}</main>
    </div>
  );
}
