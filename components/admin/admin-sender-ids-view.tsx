"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveSenderIdAction,
  adminSyncSenderProvidersAction,
  adminResubmitSenderProvidersAction,
  adminSyncAllSenderProvidersAction,
  rejectSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
import { SenderIdRegisterForm } from "@/components/admin/sender-id-register-form";
import { SenderIdProviderBadges } from "@/components/admin/sender-id-provider-badges";
import { SenderIdsDashboardCharts } from "@/components/admin/sender-ids-dashboard-charts";
import { MnotifySenderIdsPanel } from "@/components/admin/mnotify-sender-ids-panel";
import type { MnotifySenderInventoryRow } from "@/lib/sender-ids/mnotify-inventory";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminListRow,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import type { AdminSenderIdsDashboard } from "@/lib/admin/sender-ids-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SenderIdProviderRegistration } from "@/lib/generated/prisma/client";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

type SenderRow = {
  id: string;
  value: string;
  countryCode: string;
  status: string;
  isDefault: boolean;
  adminNote: string | null;
  providerStatus: string | null;
  createdAt: Date;
  user: { id: string; fullName: string; phone: string };
  providerRegistrations: SenderIdProviderRegistration[];
};

type TabId = "overview" | "pending" | "register" | "all" | "mnotify";

const SAVED_MESSAGES: Record<string, string> = {
  created: "Sender ID created and submitted to configured providers.",
  sync: "Provider statuses refreshed.",
  sync_all: "All active sender IDs synced with providers.",
  resubmit: "Re-submitted to providers — check status after sync.",
  approved: "Sender ID approved on SplitSMS.",
  rejected: "Sender ID denied.",
};

const ERROR_MESSAGES: Record<string, string> = {
  provider_denied:
    "Cannot approve — provider denied or deleted this sender ID. Use Re-submit to register again.",
  notfound: "Sender ID not found.",
  duplicate: "This sender ID already exists for the member.",
  limit: "Member has reached their sender ID limit.",
  blocked: "Sender ID registration is blocked for this member.",
  invalid: "Invalid sender ID value.",
  user: "Member not found.",
};

export function AdminSenderIdsView({
  dashboard,
  pending,
  allSenders,
  members,
  mnotifyInventory,
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
    initialTab === "mnotify"
      ? initialTab
      : "overview";

  function onTabChange(value: string) {
    const params = new URLSearchParams();
    params.set("tab", value);
    router.replace(`/admin/sender-ids?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
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
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {dashboard.stats.mismatchCount} sender ID
                {dashboard.stats.mismatchCount === 1 ? "" : "s"} marked approved but not confirmed by
                any provider
              </p>
              <p className="text-xs mt-1 opacity-90">
                Sync all providers to reconcile status, or re-submit denied senders.
              </p>
            </div>
          </div>
        </AdminAlert>
      )}

      <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
        <TabsList variant="line" className="w-full justify-start rounded-none border-b bg-transparent p-0 flex-wrap h-auto">
          <TabsTrigger value="overview" className="rounded-none px-4 py-2.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-none px-4 py-2.5">
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="register" className="rounded-none px-4 py-2.5">
            Register
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-none px-4 py-2.5">
            All
          </TabsTrigger>
          <TabsTrigger value="mnotify" className="rounded-none px-4 py-2.5">
            mNotify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <AdminStatCard label="Total" value={dashboard.stats.total} variant="primary" />
            <AdminStatCard label="Pending" value={dashboard.stats.pending} />
            <AdminStatCard label="Approved" value={dashboard.stats.approved} />
            <AdminStatCard
              label="Denied"
              value={dashboard.stats.rejected}
              variant={dashboard.stats.rejected > 0 ? "warning" : "default"}
            />
            <AdminStatCard
              label="Provider mismatch"
              value={dashboard.stats.mismatchCount}
              variant={dashboard.stats.mismatchCount > 0 ? "danger" : "default"}
            />
          </div>

          <SenderIdsDashboardCharts
            statusChart={dashboard.statusChart}
            providerChart={dashboard.providerChart}
            signupChart={dashboard.signupChart}
          />

          <div className="flex flex-wrap gap-2">
            <form action={adminSyncAllSenderProvidersAction}>
              <input type="hidden" name="returnTo" value="/admin/sender-ids?tab=overview" />
              <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync all with providers
              </Button>
            </form>
          </div>

          <AdminCard title="Recent registrations">
            <ul className="divide-y divide-border/50">
              {dashboard.recent.map((s) => (
                <li key={s.id} className="py-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-mono font-semibold text-sm">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.user.fullName}</p>
                    <SenderIdProviderBadges registrations={s.providerRegistrations} />
                  </div>
                  <Badge variant="outline">{s.status}</Badge>
                </li>
              ))}
            </ul>
          </AdminCard>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <AdminCard
            title="Pending requests"
            description={
              pending.length === 0
                ? "No requests awaiting review"
                : `${pending.length} awaiting platform approval`
            }
          >
            {pending.length === 0 ? (
              <AdminEmpty>All sender ID requests are processed.</AdminEmpty>
            ) : (
              <div className="-my-1 space-y-0">
                {pending.map((s) => (
                  <SenderIdAdminRow key={s.id} sender={s} returnTo="/admin/sender-ids?tab=pending" />
                ))}
              </div>
            )}
          </AdminCard>
        </TabsContent>

        <TabsContent value="register" className="mt-0">
          <AdminCard
            title="Register sender ID for a member"
            description="Creates the sender and submits to mNotify, Twilio, and Infobip when configured."
          >
            <SenderIdRegisterForm
              members={members}
              returnTo="/admin/sender-ids?tab=register"
            />
          </AdminCard>
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <AdminCard title="All sender IDs" description={`${allSenders.length} shown (latest 100)`}>
            {allSenders.length === 0 ? (
              <AdminEmpty>No sender IDs yet.</AdminEmpty>
            ) : (
              <div className="-my-1 space-y-0">
                {allSenders.map((s) => (
                  <SenderIdAllRow key={s.id} sender={s} />
                ))}
              </div>
            )}
          </AdminCard>
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
            <AdminEmpty>Loading mNotify inventory…</AdminEmpty>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SenderIdAllRow({ sender: s }: { sender: SenderRow }) {
  const returnTo = "/admin/sender-ids?tab=all";
  const canResubmit =
    s.status === "REJECTED" ||
    s.providerRegistrations.some(
      (r) => r.status === "REJECTED" || r.status === "FAILED",
    );

  return (
    <AdminListRow>
      <div className="min-w-0 space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold font-mono text-sm">{s.value}</p>
          <Badge variant="outline" className="text-[10px]">
            {s.status}
          </Badge>
          <Link
            href={`/admin/members/${s.user.id}?tab=senders`}
            className="text-xs text-primary hover:underline"
          >
            {s.user.fullName}
          </Link>
        </div>
        {s.adminNote && <p className="text-xs text-muted-foreground">{s.adminNote}</p>}
        <SenderIdProviderBadges registrations={s.providerRegistrations} />
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <form action={adminSyncSenderProvidersAction}>
          <input type="hidden" name="senderId" value={s.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button size="sm" type="submit" variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Sync
          </Button>
        </form>
        {canResubmit && (
          <form action={adminResubmitSenderProvidersAction}>
            <input type="hidden" name="senderId" value={s.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button size="sm" type="submit" variant="secondary" className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Re-submit
            </Button>
          </form>
        )}
      </div>
    </AdminListRow>
  );
}

function SenderIdAdminRow({
  sender: s,
  returnTo,
}: {
  sender: SenderRow;
  returnTo: string;
}) {
  const providerDenied = s.providerRegistrations.some(
    (r) => r.status === "REJECTED" || r.status === "FAILED",
  );

  return (
    <AdminListRow>
      <div className="min-w-0 space-y-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold font-mono text-sm">{s.value}</p>
          <Badge variant="outline" className="text-[10px]">
            {s.countryCode}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{s.user.fullName}</p>
        <p className="text-xs text-muted-foreground">{s.user.phone}</p>
        <SenderIdProviderBadges registrations={s.providerRegistrations} />
        {s.providerStatus && (
          <p className="text-[11px] text-muted-foreground">{s.providerStatus}</p>
        )}
        {providerDenied && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Provider denied — use Re-submit before approving.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <form action={adminSyncSenderProvidersAction}>
          <input type="hidden" name="senderId" value={s.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button size="sm" type="submit" variant="secondary" className="w-full sm:w-auto gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Sync providers
          </Button>
        </form>
        {providerDenied && (
          <form action={adminResubmitSenderProvidersAction}>
            <input type="hidden" name="senderId" value={s.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button size="sm" type="submit" variant="outline" className="w-full sm:w-auto gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Re-submit
            </Button>
          </form>
        )}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <form action={approveSenderIdAction}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="setDefault" value="1" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button size="sm" type="submit" disabled={providerDenied}>
              Approve
            </Button>
          </form>
          <form action={rejectSenderIdAction} className="flex gap-2 items-center">
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Input name="note" placeholder="Deny reason" className="h-8 w-36 text-xs" />
            <Button size="sm" type="submit" variant="destructive">
              Deny
            </Button>
          </form>
        </div>
      </div>
    </AdminListRow>
  );
}
