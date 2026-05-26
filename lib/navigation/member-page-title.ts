import { dashboardNavCategories } from "@/lib/navigation/dashboard-nav";
import { developersNavItems } from "@/lib/navigation/developers-nav";
import { isDevelopersNavActive } from "@/lib/navigation/developers-nav";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/send": "Send SMS",
  "/dashboard/sender-ids": "Sender IDs",
  "/dashboard/contacts": "Contacts",
  "/dashboard/campaigns": "Campaigns",
  "/dashboard/templates": "Templates",
  "/dashboard/wallet": "Wallet",
  "/dashboard/reports": "Message results",
  "/dashboard/pricing": "Pricing",
  "/dashboard/transactions": "Transactions",
  "/dashboard/invoices": "Invoices",
  "/dashboard/automation": "Automation",
  "/dashboard/api-keys": "API keys",
  "/dashboard/api-logs": "API logs",
  "/dashboard/campaigns/new": "New campaign",
  "/dashboard/settings": "Settings",
  "/dashboard/support": "Support",
  "/developers": "Developers",
  "/developers/docs": "Documentation",
  "/developers/api-keys": "API keys",
  "/developers/postman": "Postman",
  "/developers/webhooks": "Webhooks",
  "/developers/logs": "Request logs",
  "/developers/integrations": "Integrations",
};

export function getMemberPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  for (const item of developersNavItems) {
    if (isDevelopersNavActive(pathname, item.href, item.exact)) {
      return item.label;
    }
  }

  for (const cat of dashboardNavCategories) {
    for (const item of cat.items) {
      if (pathname.startsWith(item.href) && item.href !== "/dashboard") {
        return item.label;
      }
    }
  }

  if (pathname.startsWith("/developers")) return "Developers";
  if (pathname.startsWith("/dashboard/campaigns")) return "Campaigns";
  return "Dashboard";
}
