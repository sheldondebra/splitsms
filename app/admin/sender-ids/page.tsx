import { prisma } from "@/lib/db";
import { backfillSenderProviderRegistrations } from "@/lib/sender-ids/provider-registrations";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { AdminSenderIdsView } from "@/components/admin/admin-sender-ids-view";
import { BadgeCheck } from "lucide-react";

const senderInclude = {
  user: { select: { id: true, fullName: true, phone: true } },
  providerRegistrations: true,
} as const;

type TabId = "pending" | "register" | "all";

function parseTab(tab: string | undefined): TabId {
  if (tab === "register" || tab === "all") return tab;
  return "pending";
}

export default async function AdminSenderIdsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  const { tab, saved, error } = await searchParams;
  const initialTab = parseTab(tab);

  await backfillSenderProviderRegistrations();

  const [pending, allSenders, members] = await Promise.all([
    prisma.senderId.findMany({
      where: { status: "PENDING" },
      include: senderInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.senderId.findMany({
      include: senderInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      select: { id: true, fullName: true, phone: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
  ]);

  const memberOptions = members.map((m) => ({
    id: m.id,
    label: `${m.fullName} · ${m.phone}`,
  }));

  return (
    <AdminPage>
      <AdminPageHeader
        title="Sender IDs"
        description="Register sender IDs for members, submit to all SMS providers, and approve for sending."
        icon={BadgeCheck}
      />
      <AdminSenderIdsView
        pending={pending}
        allSenders={allSenders}
        members={memberOptions}
        initialTab={initialTab}
        saved={saved}
        error={error}
      />
    </AdminPage>
  );
}
