import { Suspense } from "react";
import { AdminPage } from "@/components/admin/admin-page-shell";
import { MemberAdminToasts } from "@/components/admin/member-admin-toasts";
import { MemberDetailView } from "@/components/admin/member-detail-view";
import { getAdminMemberDetail } from "@/lib/admin/member-detail";

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    saved?: string;
    error?: string;
    temp?: string;
    cooldown?: string;
    detail?: string;
  }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const data = await getAdminMemberDetail(id);

  return (
    <AdminPage wide>
      <Suspense fallback={null}>
        <MemberAdminToasts memberId={id} />
      </Suspense>
      <MemberDetailView
        data={data}
        initialTab={q.tab}
        flash={{
          saved: q.saved,
          error: q.error,
          temp: q.temp,
          cooldown: q.cooldown,
          detail: q.detail,
        }}
      />
    </AdminPage>
  );
}
