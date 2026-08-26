import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { syncUserSenderIdsFromMnotify } from "@/lib/sender-ids/provider-sync";
import { memberSenderNote } from "@/lib/sms/member-facing";
import { isMnotifyHoldStatus } from "@/lib/sender-ids/provider-status";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import {
  SenderIdsDashboard,
  type SenderIdsDashboardProps,
} from "@/components/dashboard/sender-ids-dashboard";
import { SenderIdPendingPoller } from "@/components/dashboard/sender-id-pending-poller";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SenderIdItem } from "@/components/dashboard/sender-id-list";

const ALERT_MESSAGES: Record<string, { success?: string; error?: string }> = {
  requested: {
    success: "Sender ID submitted for approval. Status is pending until SplitSMS reviews it.",
  },
  approved: {
    success: "Sender ID approved — you can use it to send SMS now.",
  },
  default: {
    success: "Default Sender ID updated for new messages.",
  },
  docsent: {
    success: "Verification link emailed to you — check your inbox.",
  },
  invalid: {
    error: "invalid_sender_id",
  },
  reserved: {
    error: "reserved_sender_id",
  },
  banned: {
    error: "banned_sender_id",
  },
  reason: {
    error: "sender_reason_required",
  },
  duplicate: {
    error: "duplicate_sender_id",
  },
  notfound: {
    error: "sender_not_found",
  },
  provider: {
    error: "sender_provider_failed",
  },
};

export default async function SenderIdsPage({
  searchParams,
}: {
  searchParams: Promise<{
    requested?: string;
    approved?: string;
    default?: string;
    docsent?: string;
    error?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  await syncUserSenderIdsFromMnotify(session.userId);

  const senderIds = await prisma.senderId.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { verificationDocuments: true } } },
  });

  const items: SenderIdItem[] = senderIds.map((s) => ({
    id: s.id,
    value: s.value,
    countryCode: s.countryCode,
    status: s.status,
    isDefault: s.isDefault,
    adminNote: memberSenderNote(s.adminNote, s.status),
    providerSubmittedAt: s.providerSubmittedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    onHold: isMnotifyHoldStatus(s.providerStatus),
    hasDocument: s._count.verificationDocuments > 0,
  }));

  const approved = items.filter((s) => s.status === "APPROVED");
  const pending = items.filter((s) => s.status === "PENDING");
  const defaultId = approved.find((s) => s.isDefault) ?? approved[0] ?? null;

  const alertKey = params.approved
    ? "approved"
    : params.requested
      ? "requested"
      : params.default
        ? "default"
        : params.docsent
          ? "docsent"
          : params.error ?? null;
  const alert = alertKey ? ALERT_MESSAGES[alertKey] : null;

  const dashboardProps: SenderIdsDashboardProps = {
    items,
    defaultId,
  };

  return (
    <AppPage wide>
      <PageHeader
        title="Sender IDs"
        description="The brand name recipients see on their phone. Register, track approval, and set your default."
        icon={BadgeCheck}
        mobileDescription="Brand name on SMS — pending until approved."
        actions={
          <Link
            href="/dashboard/send"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full md:h-10 md:w-auto inline-flex items-center justify-center gap-2",
            )}
          >
            Send SMS →
          </Link>
        }
      />

      {alert?.success && <FriendlyAlert success="1" successMessage={alert.success} />}
      {alert?.error && <FriendlyAlert error={alert.error} />}

      <SenderIdPendingPoller enabled={pending.length > 0} />

      <SenderIdsDashboard {...dashboardProps} />
    </AppPage>
  );
}
