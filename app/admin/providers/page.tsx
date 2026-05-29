import { ProvidersAdminView } from "@/components/admin/providers-admin-view";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { getProvidersAdminDashboard } from "@/lib/admin/providers-dashboard";
import { Layers3 } from "lucide-react";

type TabId = "mnotify" | "infobip" | "twilio";

function parseTab(tab: string | undefined): TabId {
  if (tab === "infobip" || tab === "twilio") return tab;
  return "mnotify";
}

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; test?: string }>;
}) {
  const { tab, saved, test } = await searchParams;
  const data = await getProvidersAdminDashboard();
  const initialTab = parseTab(tab);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Providers"
        description="Configure SMS gateways, view balances, and see which provider handles the most traffic."
        icon={Layers3}
      />
      <ProvidersAdminView
        data={data}
        initialTab={initialTab}
        saved={saved}
        test={test}
      />
    </AdminPage>
  );
}
