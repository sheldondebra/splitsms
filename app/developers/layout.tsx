import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Code2, Key, Webhook, ScrollText, BookOpen } from "lucide-react";

const links = [
  { href: "/developers", label: "Overview", icon: Code2 },
  { href: "/developers/docs", label: "Docs", icon: BookOpen },
  { href: "/developers/api-keys", label: "API Keys", icon: Key },
  { href: "/developers/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/developers/logs", label: "Logs", icon: ScrollText },
];

export default async function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r bg-muted/30 p-4 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Developer
        </p>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
                "hover:bg-muted transition-colors",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-4xl">{children}</main>
    </div>
  );
}
