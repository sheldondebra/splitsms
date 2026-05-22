import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DevelopersSidebar } from "@/components/developers/developers-sidebar";
import { DevelopersTopbar } from "@/components/developers/developers-topbar";

export default async function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <DevelopersSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-10 lg:p-12 max-w-5xl">
        <DevelopersTopbar />
        {children}
      </main>
    </div>
  );
}
