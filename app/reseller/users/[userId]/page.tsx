import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerClientDetail } from "@/lib/reseller/clients";
import { ClientDetailView } from "@/components/reseller/clients/client-detail-view";
import { redirect } from "next/navigation";

export default async function ResellerClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?: string;
    saved?: string;
    error?: string;
    temp?: string;
    created?: string;
    key?: string;
    keyId?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { userId } = await params;
  const q = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const data = await getResellerClientDetail(reseller.id, userId);

  return (
    <ClientDetailView
      data={data}
      initialTab={q.tab}
      flash={{
        saved: q.saved,
        error: q.error,
        temp: q.temp,
        created: q.created,
        apiKey: q.key,
      }}
    />
  );
}
