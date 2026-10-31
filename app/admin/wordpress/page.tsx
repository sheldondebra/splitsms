import { AdminWordPressView } from "@/components/admin/admin-wordpress-view";
import {
  getWordPressAdminOverview,
  listWordPressPluginLeads,
  listWordPressSitesForAdmin,
} from "@/lib/wordpress/admin";

export const metadata = {
  title: "WordPress — Admin",
};

export default async function AdminWordPressPage() {
  const [sites, leads] = await Promise.all([
    listWordPressSitesForAdmin(),
    listWordPressPluginLeads(),
  ]);
  const overview = await getWordPressAdminOverview(sites);

  return <AdminWordPressView overview={overview} sites={sites} leads={leads} />;
}
