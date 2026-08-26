"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  SenderIdApproveDialog,
  SenderIdCancelDialog,
  SenderIdDenyDialog,
  useSenderSummary,
} from "@/components/admin/sender-id-action-dialogs";
import {
  resubmitSenderProvidersJsonAction,
  submitSenderToProvidersJsonAction,
  syncSenderProvidersJsonAction,
  notifySenderIdLiveJsonAction,
  requestSenderIdDocumentJsonAction,
  blockSenderIdAction,
  adminSyncAllSenderProvidersAction,
} from "@/lib/actions/admin-sender-ids";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SenderIdProviderRegistration } from "@/lib/generated/prisma/client";
import { isMnotifyHoldStatus } from "@/lib/sender-ids/provider-status";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Globe,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldX,
  User,
  XCircle,
} from "lucide-react";

const PAGE_SIZE = 10;

function SenderIdPaginatedList({
  items,
  returnTo,
  empty,
}: {
  items: SenderRow[];
  returnTo: string;
  empty: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const listKey = `${items.length}:${items[0]?.id ?? ""}:${items[items.length - 1]?.id ?? ""}`;

  useEffect(() => {
    setPage(1);
  }, [listKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  if (items.length === 0) return <>{empty}</>;

  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, items.length);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {pageItems.map((s) => (
          <SenderIdAdminRow key={s.id} sender={s} returnTo={returnTo} />
        ))}
      </ul>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {rangeStart}–{rangeEnd} of {items.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - page) <= 1;
                })
                .reduce<(number | "gap")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("gap");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "gap" ? (
                    <span key={`gap-${idx}`} className="px-1 text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      type="button"
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 w-8 px-0 text-xs tabular-nums",
                        p === page &&
                          "bg-amber-500/90 text-amber-950 hover:bg-amber-500 border-amber-500/50",
                      )}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ),
                )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type SenderVerificationDocumentRow = {
  id: string;
  docType: string;
  filename: string;
  createdAt: Date;
};

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
  verificationDocuments?: SenderVerificationDocumentRow[];
};

const SENDER_DOCUMENT_TYPE_LABEL: Record<string, string> = {
  BUSINESS_REGISTRATION: "Business reg.",
  PASSPORT: "Passport",
  GHANA_CARD: "Ghana Card",
  OTHER_ID: "Government ID",
};

type TabId = "overview" | "pending" | "register" | "all" | "mnotify" | "banned";

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

function isSenderOnHold(s: {
  providerStatus: string | null;
  providerRegistrations: SenderIdProviderRegistration[];
}) {
  return (
    isMnotifyHoldStatus(s.providerStatus) ||
    s.providerRegistrations.some((r) => isMnotifyHoldStatus(r.providerStatus))
  );
}

function SenderStatsBar({ stats }: { stats: AdminSenderIdsDashboard["stats"] }) {
  const items = [
    { label: "Pending", value: stats.pending, hot: stats.pending > 0, primary: true },
    { label: "On hold", value: stats.onHoldCount, hot: stats.onHoldCount > 0, warn: true },
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 lg:divide-y-0 divide-border/50">
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
  const [tab, setTab] = useState<TabId>(
    initialTab === "overview" ||
      initialTab === "register" ||
      initialTab === "all" ||
      initialTab === "pending" ||
      initialTab === "mnotify" ||
      initialTab === "banned"
      ? initialTab
      : "pending",
  );

  useEffect(() => {
    if (
      initialTab === "overview" ||
      initialTab === "register" ||
      initialTab === "all" ||
      initialTab === "pending" ||
      initialTab === "mnotify" ||
      initialTab === "banned"
    ) {
      setTab(initialTab);
    }
  }, [initialTab]);

  function onTabChange(value: string) {
    const next = value as TabId;
    setTab(next);
    const params = new URLSearchParams();
    params.set("tab", next);
    router.replace(`/admin/sender-ids?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4 md:space-y-5">
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
        <div className="rounded-xl border border-border/60 bg-muted/25 p-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0"
          >
            {[
              {
                value: "pending",
                label: "Pending",
                count: pending.length > 0 ? pending.length : null,
              },
              { value: "all", label: "All" },
              { value: "register", label: "Register" },
              { value: "overview", label: "Overview" },
              { value: "mnotify", label: "mNotify" },
              {
                value: "banned",
                label: "Banned",
                count:
                  (bannedDashboard.config.bannedEntries.length ?? 0) > 0
                    ? bannedDashboard.config.bannedEntries.length
                    : null,
              },
            ].map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  "h-9 rounded-lg px-3.5 text-xs sm:text-sm",
                  "data-active:border-amber-500/40 data-active:bg-amber-500/15 data-active:text-amber-800 data-active:shadow-none",
                  "dark:data-active:bg-amber-500/20 dark:data-active:text-amber-200",
                )}
              >
                {item.label}
                {item.count != null ? (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 h-4 border-transparent bg-amber-500/20 px-1.5 py-0 text-[9px] text-amber-800 dark:text-amber-200"
                  >
                    {item.count}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-0">
          <AdminCard
            title="Pending & on hold"
            description={
              pending.length === 0
                ? "No requests awaiting review"
                : "Includes SplitSMS review and sender IDs providers have placed on hold"
            }
            dense
          >
            <SenderIdPaginatedList
              items={pending}
              returnTo="/admin/sender-ids?tab=pending"
              empty={
                <AdminEmpty dense>
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500 opacity-80" />
                  All sender ID requests are processed.
                </AdminEmpty>
              }
            />
          </AdminCard>
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <AdminCard
            title="All sender IDs"
            description={`${allSenders.length} loaded (latest 100) · ${PAGE_SIZE} per page`}
            dense
          >
            <SenderIdPaginatedList
              items={allSenders}
              returnTo="/admin/sender-ids?tab=all"
              empty={<AdminEmpty dense>No sender IDs yet.</AdminEmpty>}
            />
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

function statusBadgeClass(status: string) {
  if (status === "APPROVED") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }
  if (status === "PENDING") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
  if (status === "REJECTED") {
    return "border-destructive/40 bg-destructive/10 text-destructive";
  }
  return "";
}

function SenderIdAdminRow({
  sender: s,
  returnTo,
}: {
  sender: SenderRow;
  returnTo: string;
}) {
  const router = useRouter();
  const [menuPending, startMenuTransition] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [denyOpen, setDenyOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const blockFormRef = useRef<HTMLFormElement>(null);

  const submitted = Boolean(s.providerSubmittedAt);
  const denied = allProvidersDenied(s.providerRegistrations);
  const onHold = isSenderOnHold(s);
  const approvedOnCarrier = anyProviderApproved(s.providerRegistrations) && !onHold;
  const providerRejectedOrFailed = s.providerRegistrations.some(
    (r) => r.status === "REJECTED" || r.status === "FAILED",
  );
  const canResubmit =
    s.status === "REJECTED" ||
    providerRejectedOrFailed ||
    (submitted && !approvedOnCarrier);
  const waitingOnCarrier = submitted && !approvedOnCarrier && !denied;
  const splitsmsApprovedNote = Boolean(
    s.adminNote?.toLowerCase().includes("approved by splitsms"),
  );

  const statusLine = onHold
    ? "On hold at the provider"
    : !submitted
    ? s.adminNote?.toLowerCase().includes("cancelled")
      ? "Cancelled — not submitted to registrar"
      : "Not submitted to carriers yet"
    : approvedOnCarrier
      ? "Carrier approved — confirm on SplitSMS"
      : denied
        ? "All carriers denied"
        : splitsmsApprovedNote
          ? "Approved by SplitSMS — waiting on carriers"
          : "Waiting on carrier registration";

  const StatusIcon = onHold
    ? Clock
    : !submitted
    ? Clock
    : approvedOnCarrier
      ? CheckCircle2
      : denied
        ? AlertTriangle
        : Loader2;

  const summary = useSenderSummary(s, returnTo);

  const primary =
    s.status === "PENDING" && !submitted
      ? ({ kind: "approve_submit" as const, label: "Approve & submit" })
      : canResubmit && (denied || s.status === "REJECTED")
        ? ({ kind: "resubmit" as const, label: "Re-submit" })
        : s.status === "PENDING" && submitted && approvedOnCarrier
          ? ({ kind: "confirm_approval" as const, label: "Confirm approval" })
          : s.status === "PENDING" && submitted && waitingOnCarrier
            ? ({ kind: "submitted" as const, label: "Submitted to providers" })
            : s.status === "APPROVED"
              ? ({ kind: "notify_live" as const, label: "Notify: live now" })
              : null;

  function runNotifyLive() {
    startMenuTransition(async () => {
      const toastId = toast.loading(`Notifying member that ${s.value} is live…`);
      const result = await notifySenderIdLiveJsonAction({ id: s.id });
      if (!result.ok) {
        toast.error("Notify failed", { id: toastId, description: result.message });
        return;
      }
      toast.success("Member notified", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  function runSync() {
    startMenuTransition(async () => {
      const toastId = toast.loading("Syncing carrier status…");
      const result = await syncSenderProvidersJsonAction({ senderId: s.id });
      if (!result.ok) {
        toast.error("Sync failed", { id: toastId, description: result.message });
        return;
      }
      toast.success("Synced", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  function runResubmit() {
    startMenuTransition(async () => {
      const toastId = toast.loading("Re-submitting to carriers…");
      const result = await resubmitSenderProvidersJsonAction({ senderId: s.id });
      if (!result.ok) {
        toast.error("Re-submit failed", { id: toastId, description: result.message });
        return;
      }
      toast.success("Re-submitted", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  function runRequestDocument() {
    startMenuTransition(async () => {
      const toastId = toast.loading(`Requesting a document from ${s.user.fullName}…`);
      const result = await requestSenderIdDocumentJsonAction({ senderId: s.id });
      if (!result.ok) {
        toast.error("Request failed", { id: toastId, description: result.message });
        return;
      }
      if (result.url) {
        try {
          await navigator.clipboard.writeText(result.url);
          toast.success("Email sent — link copied", { id: toastId, description: result.message });
        } catch {
          toast.success("Email sent", { id: toastId, description: result.message });
        }
      } else {
        toast.success("Requested", { id: toastId, description: result.message });
      }
      router.refresh();
    });
  }

  function runSubmitOnly() {
    startMenuTransition(async () => {
      const toastId = toast.loading("Submitting to carriers…");
      const result = await submitSenderToProvidersJsonAction({
        id: s.id,
        purpose: summary.defaultPurpose,
      });
      if (!result.ok) {
        toast.error("Submit failed", { id: toastId, description: result.message });
        return;
      }
      toast.success("Submitted", { id: toastId, description: result.message });
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-3 transition-colors sm:px-4",
        waitingOnCarrier || onHold
          ? "border-amber-500/30 bg-amber-500/[0.04]"
          : approvedOnCarrier
            ? "border-emerald-500/25 bg-emerald-500/[0.03]"
            : denied
              ? "border-destructive/25 bg-destructive/[0.03]"
              : "border-border/50 bg-card/40 hover:border-border hover:bg-muted/20",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-base font-bold tracking-tight">{s.value}</p>
            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", statusBadgeClass(s.status))}>
              {s.status}
            </Badge>
            {onHold ? (
              <Badge
                variant="outline"
                className="h-5 gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 text-[10px] text-amber-800 dark:text-amber-200"
              >
                <Clock className="h-3 w-3" />
                On hold
              </Badge>
            ) : null}
            <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
              <Globe className="h-3 w-3" />
              {s.countryCode}
            </Badge>
            {s.isDefault ? <Badge className="h-5 px-1.5 text-[10px]">Default</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/admin/members/${s.user.id}?tab=senders`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
            >
              <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="max-w-[180px] truncate">{s.user.fullName}</span>
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {s.user.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {formatDistanceToNow(s.createdAt, { addSuffix: true })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                waitingOnCarrier && "text-primary",
                approvedOnCarrier && "text-emerald-700 dark:text-emerald-300",
                denied && "text-destructive",
                !waitingOnCarrier && !approvedOnCarrier && !denied && "text-muted-foreground",
              )}
            >
              <StatusIcon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  waitingOnCarrier && "animate-spin",
                )}
              />
              {statusLine}
            </p>
            <SenderIdProviderPanel registrations={s.providerRegistrations} compact />
          </div>

          {s.verificationDocuments && s.verificationDocuments.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3 w-3" />
                Documents
              </span>
              {s.verificationDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={`/admin/sender-ids/documents/${doc.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:border-primary/40 hover:text-primary"
                >
                  <Download className="h-3 w-3" />
                  {SENDER_DOCUMENT_TYPE_LABEL[doc.docType] ?? "Document"}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {primary?.kind === "approve_submit" || primary?.kind === "confirm_approval" ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setApproveOpen(true)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {primary.label}
            </Button>
          ) : null}

          {primary?.kind === "submitted" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              disabled
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {primary.label}
            </Button>
          ) : null}

          {primary?.kind === "resubmit" ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={menuPending}
              onClick={runResubmit}
            >
              {menuPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              {primary.label}
            </Button>
          ) : null}

          {primary?.kind === "notify_live" ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={menuPending}
              onClick={runNotifyLive}
            >
              {menuPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {primary.label}
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={menuPending}
                  aria-label="More actions"
                />
              }
            >
              {menuPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onClick={runSync}>
                <RefreshCw className="h-4 w-4" />
                Sync carriers
              </DropdownMenuItem>
              {s.status !== "APPROVED" ? (
                <DropdownMenuItem onClick={runRequestDocument}>
                  <FileText className="h-4 w-4" />
                  Request document (email + copy link)
                </DropdownMenuItem>
              ) : null}
              {!submitted && s.status === "PENDING" ? (
                <DropdownMenuItem onClick={runSubmitOnly}>
                  <Send className="h-4 w-4" />
                  Submit to carriers only
                </DropdownMenuItem>
              ) : null}
              {canResubmit && primary?.kind !== "resubmit" ? (
                <DropdownMenuItem onClick={runResubmit}>
                  <RotateCcw className="h-4 w-4" />
                  {s.status === "REJECTED" || providerRejectedOrFailed
                    ? "Re-submit"
                    : "Resend to carriers"}
                </DropdownMenuItem>
              ) : null}
              {s.status === "APPROVED" ? (
                <DropdownMenuItem onClick={runNotifyLive}>
                  <Mail className="h-4 w-4" />
                  Resend live notification
                </DropdownMenuItem>
              ) : null}
              {s.status === "PENDING" || s.status === "APPROVED" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCancelOpen(true)}>
                    <XCircle className="h-4 w-4" />
                    Cancel sender ID
                  </DropdownMenuItem>
                </>
              ) : null}
              {s.status === "PENDING" ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDenyOpen(true)}
                >
                  <ShieldX className="h-4 w-4" />
                  Deny & ban
                </DropdownMenuItem>
              ) : null}
              {s.status !== "REJECTED" && s.status !== "PENDING" ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => blockFormRef.current?.requestSubmit()}
                >
                  Block & ban
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <form ref={blockFormRef} action={blockSenderIdAction} className="hidden">
        <input type="hidden" name="id" value={s.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="addToBanList" value="on" />
        <input type="hidden" name="note" value="Blocked by admin" />
      </form>

      {primary?.kind === "approve_submit" || primary?.kind === "confirm_approval" ? (
        <SenderIdApproveDialog
          sender={summary}
          mode={primary.kind}
          open={approveOpen}
          onOpenChange={setApproveOpen}
        />
      ) : null}

      {s.status === "PENDING" ? (
        <SenderIdDenyDialog sender={summary} open={denyOpen} onOpenChange={setDenyOpen} />
      ) : null}

      {s.status === "PENDING" || s.status === "APPROVED" ? (
        <SenderIdCancelDialog sender={summary} open={cancelOpen} onOpenChange={setCancelOpen} />
      ) : null}
    </li>
  );
}
