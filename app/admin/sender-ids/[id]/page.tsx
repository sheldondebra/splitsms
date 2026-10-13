import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-shell";
import { getSenderIdManagementDetail } from "@/lib/admin/sender-id-management-detail";
import { SenderIdManageView } from "@/components/admin/sender-id-manage-view";

export default async function SenderIdManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; returnTo?: string }>;
}) {
  const { id } = await params;
  const { saved, error, returnTo } = await searchParams;

  const detail = await getSenderIdManagementDetail(id);
  if (!detail) notFound();

  const members = await prisma.user.findMany({
    where: { role: "MEMBER", id: { not: detail.sender.user.id } },
    select: { id: true, fullName: true, phone: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });

  return (
    <AdminPage wide>
      <AdminPageHeader
        title={`Manage sender ID — ${detail.sender.value}`}
        description="Suspend, block, reassign, or share this sender ID, and review how it's being used."
        icon={BadgeCheck}
        actions={
          <Link
            href={returnTo || "/admin/sender-ids"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sender IDs
          </Link>
        }
      />
      <SenderIdManageView
        detail={detail}
        members={members.map((m) => ({ id: m.id, label: `${m.fullName} · ${m.phone}` }))}
        saved={saved}
        error={error}
        returnTo={returnTo || "/admin/sender-ids"}
      />
    </AdminPage>
  );
}
