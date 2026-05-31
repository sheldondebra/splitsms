import { prisma } from "@/lib/db";
import { backfillSenderProviderRegistrations } from "@/lib/sender-ids/provider-registrations";
import { getAdminSenderIdsDashboard } from "@/lib/admin/sender-ids-dashboard";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { AdminSenderIdsView } from "@/components/admin/admin-sender-ids-view";
import { buildMnotifySenderInventory } from "@/lib/sender-ids/mnotify-inventory";
import { BadgeCheck } from "lucide-react";

const senderInclude = {
  user: { select: { id: true, fullName: true, phone: true } },
  providerRegistrations: true,
} as const;

type TabId = "overview" | "pending" | "register" | "all" | "mnotify";

function parseTab(tab: string | undefined): TabId {
  if (tab === "register" || tab === "all" || tab === "overview" || tab === "mnotify") return tab;
  return "pending";
}

export default async function AdminSenderIdsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string; warn?: string; detail?: string }>;
}) {
  const { tab, saved, error, warn, detail } = await searchParams;
  const initialTab = parseTab(tab);

  await backfillSenderProviderRegistrations();

  const loadMnotify = initialTab === "mnotify";

  const [dashboard, pending, allSenders, members, mnotifyInventory] = await Promise.all([
    getAdminSenderIdsDashboard(),
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
    loadMnotify ? buildMnotifySenderInventory() : Promise.resolve(null),
  ]);

  const memberOptions = members.map((m) => ({
    id: m.id,
    label: `${m.fullName} · ${m.phone}`,
  }));

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Sender IDs"
        description="Register sender IDs, sync provider status (mNotify, Twilio, Infobip), and approve for sending."
        icon={BadgeCheck}
      />
      <AdminSenderIdsView
        dashboard={dashboard}
        pending={pending}
        allSenders={allSenders}
        members={memberOptions}
        mnotifyInventory={mnotifyInventory}
        initialTab={initialTab}
        saved={saved}
        error={error}
        warn={warn}
        detail={detail}
      />
    </AdminPage>
  );
}
