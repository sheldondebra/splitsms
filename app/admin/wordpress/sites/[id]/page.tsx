import { notFound } from "next/navigation";
import { AdminWordPressSiteDetailView } from "@/components/admin/admin-wordpress-site-detail-view";
import { getWordPressSiteDetail } from "@/lib/wordpress/admin";

export const metadata = {
  title: "WordPress site — Admin",
};

export default async function AdminWordPressSiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await getWordPressSiteDetail(id);
  if (!site) notFound();

  return <AdminWordPressSiteDetailView site={site} />;
}
