"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveSenderIdAction,
  adminSyncSenderProvidersAction,
  rejectSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
import { SenderIdRegisterForm } from "@/components/admin/sender-id-register-form";
import { SenderIdProviderBadges } from "@/components/admin/sender-id-provider-badges";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SenderIdProviderRegistration } from "@/lib/generated/prisma/client";

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

type TabId = "pending" | "register" | "all";

export function AdminSenderIdsView({
  pending,
  allSenders,
  members,
  initialTab,
  saved,
  error,
}: {
  pending: SenderRow[];
  allSenders: SenderRow[];
  members: { id: string; label: string }[];
  initialTab: TabId;
  saved?: string;
  error?: string;
}) {
  const router = useRouter();
  const tab = initialTab === "register" || initialTab === "all" ? initialTab : "pending";

  function onTabChange(value: string) {
    const params = new URLSearchParams();
    params.set("tab", value);
    router.replace(`/admin/sender-ids?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      {saved === "created" && (
        <AdminAlert variant="success">
          Sender ID created and submitted to configured providers.
        </AdminAlert>
      )}
      {saved === "sync" && (
        <AdminAlert variant="success">Provider statuses refreshed.</AdminAlert>
      )}
      {error && (
        <AdminAlert variant="warning">
          Could not complete action ({error}). Check member limits and sender name rules.
        </AdminAlert>
      )}

      <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
        <TabsList variant="line" className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="pending" className="rounded-none px-4 py-2.5">
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="register" className="rounded-none px-4 py-2.5">
            Register for member
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-none px-4 py-2.5">
            All senders
          </TabsTrigger>
        </TabsList>

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
          <AdminCard title="All sender IDs" description={`${allSenders.length} total`}>
            {allSenders.length === 0 ? (
              <AdminEmpty>No sender IDs yet.</AdminEmpty>
            ) : (
              <div className="-my-1">
                {allSenders.map((s) => (
                  <AdminListRow key={s.id}>
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
                      <SenderIdProviderBadges registrations={s.providerRegistrations} />
                    </div>
                    <form action={adminSyncSenderProvidersAction}>
                      <input type="hidden" name="senderId" value={s.id} />
                      <input
                        type="hidden"
                        name="returnTo"
                        value="/admin/sender-ids?tab=all"
                      />
                      <Button size="sm" type="submit" variant="outline">
                        Sync
                      </Button>
                    </form>
                  </AdminListRow>
                ))}
              </div>
            )}
          </AdminCard>
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
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <form action={adminSyncSenderProvidersAction}>
          <input type="hidden" name="senderId" value={s.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button size="sm" type="submit" variant="secondary" className="w-full sm:w-auto">
            Sync providers
          </Button>
        </form>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <form action={approveSenderIdAction}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="setDefault" value="1" />
            <Button size="sm" type="submit">
              Approve
            </Button>
          </form>
          <form action={rejectSenderIdAction} className="flex gap-2 items-center">
            <input type="hidden" name="id" value={s.id} />
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
