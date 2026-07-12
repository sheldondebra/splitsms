import type { ReactNode } from "react";
import { SiteHeaderWithAccount } from "@/components/layout/site-header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-marketing">
      <SiteHeaderWithAccount />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
