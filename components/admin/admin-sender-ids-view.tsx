"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  adminSubmitSenderToProvidersAction,
  adminSyncSenderProvidersAction,
  adminResubmitSenderProvidersAction,
  adminSyncAllSenderProvidersAction,
  blockSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
import {
  SenderIdApproveDialogTrigger,
  SenderIdDenyDialogTrigger,
  useSenderSummary,
} from "@/components/admin/sender-id-action-dialogs";
import { SenderIdRegisterForm } from "@/components/admin/sender-id-register-form";
import { SenderIdPolicyPanel } from "@/components/admin/sender-id-policy-panel";
import { SenderIdBannedPanel } from "@/components/admin/sender-id-banned-panel";
import type { AdminBannedSendersDashboard } from "@/lib/admin/sender-id-banned-types";
import { SenderIdProviderPanel } from "@/components/admin/sender-id-provider-badges";
import { SenderIdsDashboardCharts } from "@/components/admin/sender-ids-dashboard-charts";
import { MnotifySenderIdsPanel } from "@/components/admin/mnotify-sender-ids-panel";
import type { MnotifySenderInventoryRow } from "@/lib/sender-ids/mnotify-inventory";
import type { SenderIdReservedConfig } from "@/lib/sender-ids/reserved-names";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import type { AdminSenderIdsDashboard } from "@/lib/admin/sender-ids-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SenderIdProviderRegistration } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Send,
} from "lucide-react";

type SenderRow = {
  id: string;
  value: string;
  countryCode: string;
  status: string;
  isDefault: boolean;
  adminNote: string | null;
  providerStatus: string | null;
  providerSubmittedAt: Date | null;
  createdAt: Date;
  user: { id: string; fullName: string; phone: string };
  providerRegistrations: SenderIdProviderRegistration[];
};

type TabId = "overview" | "pending" | "register" | "all" | "mnotify" | "banned";

const SAVED_MESSAGES: Record<string, string> = {
  created: "Sender ID created for the member.",
  policy: "Reserved sender name rules saved.",
  submitted: "Submitted to carriers — sync status after registration completes.",
  sync: "Provider statuses refreshed.",
  sync_all: "All active sender IDs synced with providers.",
  resubmit: "Re-sent to carriers — check status after sync.",
  approved: "Sender ID approved — member can send SMS and was notified.",
  rejected: "Sender ID denied — member notified by email and SMS.",
  blocked: "Sender ID blocked and added to the ban list.",
  banned_added: "Name added to the ban list.",
  banned_removed: "Name removed from the ban list.",
};

const ERROR_MESSAGES: Record<string, string> = {
  provider_denied:
    "Cannot approve — all carriers denied this sender ID. Re-submit after fixing the name or purpose.",
  notfound: "Sender ID not found.",
  duplicate: "This sender ID already exists for the member.",
  limit: "Member has reached their sender ID limit.",
  blocked: "Sender ID registration is blocked for this member.",
  invalid: "Invalid sender ID value.",
  reserved:
    "Reserved or protected name — use admin override only with verified authorization.",
  user: "Member not found.",
};

function activeProviderRegs(regs: SenderIdProviderRegistration[]) {
  return regs.filter((r) => r.status !== "SKIPPED");
}

function allProvidersDenied(regs: SenderIdProviderRegistration[]) {
  const active = activeProviderRegs(regs);
  return active.length > 0 && active.every((r) => r.status === "REJECTED" || r.status === "FAILED");
}

function anyProviderApproved(regs: SenderIdProviderRegistration[]) {
  return regs.some((r) => r.status === "APPROVED");
}

function SenderStatsBar({ stats }: { stats: AdminSenderIdsDashboard["stats"] }) {
  const items = [
    { label: "Pending", value: stats.pending, hot: stats.pending > 0, primary: true },
    { label: "Approved", value: stats.approved, hot: false },
    { label: "Denied", value: stats.rejected, hot: stats.rejected > 0 },
    {
      label: "Provider mismatch",
      value: stats.mismatchCount,
      hot: stats.mismatchCount > 0,
      warn: stats.mismatchCount > 0,
    },
    { label: "Total", value: stats.total, hot: false },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, hot, primary, warn }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 min-w-0",
              hot && primary && "bg-primary/[0.04]",
              hot && warn && "bg-amber-500/[0.04]",
              hot && !primary && !warn && "bg-amber-500/[0.04]",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                hot && primary
                  ? "bg-primary/12 text-primary"
                  : hot && warn
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : hot
                      ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground",
              )}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-base font-bold tabular-nums leading-none",
                  hot && primary && "text-primary",
                  hot && warn && "text-amber-700 dark:text-amber-300",
                  hot && !primary && !warn && "text-amber-700 dark:text-amber-300",
                )}
              >
                {value}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSenderIdsView({
  dashboard,
  pending,
  allSenders,
  members,
  mnotifyInventory,
  reservedConfig,
  bannedDashboard,
  initialTab,
  saved,
  error,
  warn,
  detail,
}: {
  dashboard: AdminSenderIdsDashboard;
  pending: SenderRow[];
  allSenders: SenderRow[];
  members: { id: string; label: string }[];
  mnotifyInventory: {
    rows: MnotifySenderInventoryRow[];
    listSource: "api" | "discovered";
    listError?: string;
    checkedAt: string;
  } | null;
  reservedConfig: SenderIdReservedConfig;
  bannedDashboard: AdminBannedSendersDashboard;
  initialTab: TabId;
  saved?: string;
  error?: string;
  warn?: string;
  detail?: string;
}) {
  const router = useRouter();
  const tab =
    initialTab === "overview" ||
    initialTab === "register" ||
    initialTab === "all" ||
    initialTab === "pending" ||
    initialTab === "mnotify" ||
    initialTab === "banned"
      ? initialTab
      : "pending";

  function onTabChange(value: string) {
    const params = new URLSearchParams();
    params.set("tab", value);
    router.replace(`/admin/sender-ids?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {saved && SAVED_MESSAGES[saved] && (
        <AdminAlert variant="success">{SAVED_MESSAGES[saved]}</AdminAlert>
      )}
      {error && (
        <AdminAlert variant="warning">
          {ERROR_MESSAGES[error] ?? `Could not complete action (${error}).`}
        </AdminAlert>
      )}

      {dashboard.stats.mismatchCount > 0 && (
        <AdminAlert variant="warning">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">
                  {dashboard.stats.mismatchCount} approved on SplitSMS but not confirmed by
                  carriers
                </p>
                <p className="text-xs mt-0.5 opacity-90">
                  Sync all providers or re-submit denied senders.
                </p>
              </div>
            </div>
            <form action={adminSyncAllSenderProvidersAction}>
              <input type="hidden" name="returnTo" value={`/admin/sender-ids?tab=${tab}`} />
              <Button type="submit" variant="outline" size="sm" className="h-8 gap-1.5 shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync all
              </Button>
            </form>
          </div>
        </AdminAlert>
      )}

      <SenderStatsBar stats={dashboard.stats} />

      <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
        <TabsList
          variant="line"
          className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap h-auto gap-0"
        >
          <TabsTrigger value="pending" className="rounded-none px-3 py-2 text-xs sm:text-sm">
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0 h-4">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-none px-3 py-2 text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="register" className="rounded-none px-3 py-2 text-xs sm:text-sm">
            Register
          </TabsTrigger>
          <TabsTrigger value="overview" className="rounded-none px-3 py-2 text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="mnotify" className="rounded-none px-3 py-2 text-xs sm:text-sm">
            mNotify
          </TabsTrigger>
          <TabsTrigger value="banned" className="rounded-none px-3 py-2 text-xs sm:text-sm">
            Banned
            {(bannedDashboard.config.bannedEntries.length ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5 py-0 h-4">
                {bannedDashboard.config.bannedEntries.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-0">
          <AdminCard
            title="Pending requests"
            description={
              pending.length === 0
                ? "No requests awaiting review"
                : "Review each request, submit to carriers, then confirm approval when ready"
            }
            dense
          >
            {pending.length === 0 ? (
              <AdminEmpty dense>
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500 opacity-80" />
                All sender ID requests are processed.
              </AdminEmpty>
            ) : (
              <ul className="divide-y divide-border/50 -mx-2">
                {pending.map((s) => (
                  <SenderIdAdminRow key={s.id} sender={s} returnTo="/admin/sender-ids?tab=pending" />
                ))}
              </ul>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <AdminCard title="All sender IDs" description={`${allSenders.length} shown (latest 100)`} dense>
            {allSenders.length === 0 ? (
              <AdminEmpty dense>No sender IDs yet.</AdminEmpty>
            ) : (
              <ul className="divide-y divide-border/50 -mx-2">
                {allSenders.map((s) => (
                  <SenderIdAdminRow key={s.id} sender={s} returnTo="/admin/sender-ids?tab=all" />
                ))}
              </ul>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="register" className="mt-0 space-y-4">
          <AdminCard
            title="Register sender ID for a member"
            description="Creates the sender for platform review before carrier submission."
            dense
          >
            <SenderIdRegisterForm members={members} returnTo="/admin/sender-ids?tab=register" />
          </AdminCard>
          <SenderIdPolicyPanel config={reservedConfig} />
        </TabsContent>

        <TabsContent value="overview" className="mt-0 space-y-4">
          <SenderIdsDashboardCharts
            statusChart={dashboard.statusChart}
            providerChart={dashboard.providerChart}
            signupChart={dashboard.signupChart}
          />

          <AdminCard title="Recent registrations" dense>
            <ul className="divide-y divide-border/50 -mx-2">
              {dashboard.recent.map((s) => (
                <li key={s.id} className="px-2 py-2.5 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-sm">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.user.fullName}</p>
                    <SenderIdProviderPanel registrations={s.providerRegistrations} compact />
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </AdminCard>
        </TabsContent>

        <TabsContent value="banned" className="mt-0">
          <SenderIdBannedPanel dashboard={bannedDashboard} />
        </TabsContent>

        <TabsContent value="mnotify" className="mt-0">
          {mnotifyInventory ? (
            <MnotifySenderIdsPanel
              inventory={mnotifyInventory}
              members={members}
              saved={saved}
              error={error}
              warn={warn}
              detail={detail}
            />
          ) : (
            <AdminEmpty dense>Loading mNotify inventory…</AdminEmpty>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SenderIdAdminRow({
  sender: s,
  returnTo,
}: {
  sender: SenderRow;
  returnTo: string;
}) {
  const submitted = Boolean(s.providerSubmittedAt);
  const denied = allProvidersDenied(s.providerRegistrations);
  const approvedOnCarrier = anyProviderApproved(s.providerRegistrations);
  const providerRejectedOrFailed = s.providerRegistrations.some(
    (r) => r.status === "REJECTED" || r.status === "FAILED",
  );
  const canResubmit =
    s.status === "REJECTED" ||
    providerRejectedOrFailed ||
    (submitted && !approvedOnCarrier);
  const resubmitLabel =
    s.status === "REJECTED" || providerRejectedOrFailed ? "Re-submit" : "Resend to carriers";

  const statusHint = !submitted
    ? "Not submitted to carriers yet"
    : approvedOnCarrier
      ? "At least one carrier approved — confirm SplitSMS approval"
      : denied
        ? "All carriers denied — re-submit or deny on SplitSMS"
        : "Submitted — waiting on carrier registration. Resend if stuck on hold.";

  const summary = useSenderSummary(s, returnTo);

  return (
    <li className="px-2 py-3 first:pt-1 last:pb-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-bold tracking-tight">{s.value}</p>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5">
              {s.countryCode}
            </Badge>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-5">
              {s.status}
            </Badge>
            {s.isDefault && (
              <Badge className="text-[9px] px-1.5 py-0 h-5">Default</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <Link
              href={`/admin/members/${s.user.id}?tab=senders`}
              className="font-medium text-foreground hover:text-primary hover:underline"
            >
              {s.user.fullName}
            </Link>
            <span>·</span>
            <span>{s.user.phone}</span>
            <span>·</span>
            <span>{formatDistanceToNow(s.createdAt, { addSuffix: true })}</span>
          </div>

          <p
            className={cn(
              "text-xs",
              denied && "text-destructive",
              approvedOnCarrier && "text-emerald-700 dark:text-emerald-300",
              !denied && !approvedOnCarrier && "text-muted-foreground",
            )}
          >
            {statusHint}
          </p>

          {s.providerStatus && (
            <p className="text-[11px] text-muted-foreground">{s.providerStatus}</p>
          )}

          {s.adminNote && (
            <p className="text-[11px] text-muted-foreground italic">{s.adminNote}</p>
          )}

          <SenderIdProviderPanel registrations={s.providerRegistrations} compact />
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full lg:w-[220px]">
          {s.status === "PENDING" && (
            <div className="grid grid-cols-1 gap-2">
              {!submitted ? (
                <>
                  <form action={adminSubmitSenderToProvidersAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input
                      type="hidden"
                      name="purpose"
                      value={summary.defaultPurpose}
                    />
                    <Button type="submit" variant="secondary" size="sm" className="w-full h-8 gap-1.5 text-xs">
                      <Send className="h-3.5 w-3.5" />
                      Submit to carriers
                    </Button>
                  </form>
                  <SenderIdApproveDialogTrigger
                    sender={summary}
                    mode="approve_submit"
                    label="Approve & submit"
                    className="w-full h-8 gap-1.5 text-xs"
                  />
                </>
              ) : (
                <SenderIdApproveDialogTrigger
                  sender={summary}
                  mode="confirm_approval"
                  label="Confirm approval"
                  disabled={denied && !approvedOnCarrier}
                  className="w-full h-8 gap-1.5 text-xs"
                />
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <form action={adminSyncSenderProvidersAction} className="flex-1 min-w-[7rem]">
              <input type="hidden" name="senderId" value={s.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <Button type="submit" variant="outline" size="sm" className="w-full h-8 gap-1 text-xs">
                <RefreshCw className="h-3 w-3" />
                Sync
              </Button>
            </form>
            {canResubmit && (
              <form action={adminResubmitSenderProvidersAction} className="flex-1 min-w-[7rem]">
                <input type="hidden" name="senderId" value={s.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button type="submit" variant="outline" size="sm" className="w-full h-8 gap-1 text-xs">
                  <RotateCcw className="h-3 w-3" />
                  {resubmitLabel}
                </Button>
              </form>
            )}
          </div>

          {s.status === "PENDING" && (
            <div className="pt-1 border-t border-border/40">
              <SenderIdDenyDialogTrigger
                sender={summary}
                className="w-full h-8 text-xs gap-1"
              />
            </div>
          )}

          {s.status !== "REJECTED" && s.status !== "PENDING" && (
            <form action={blockSenderIdAction}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="addToBanList" value="on" />
              <input type="hidden" name="note" value="Blocked by admin" />
              <Button type="submit" variant="outline" size="sm" className="w-full h-8 text-xs text-destructive">
                Block & ban
              </Button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
