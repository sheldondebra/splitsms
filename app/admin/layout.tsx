import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppTopbar title="Admin Console" subtitle={session.phone} />
        <main className="flex-1 app-shell p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
