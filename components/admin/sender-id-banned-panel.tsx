import { format } from "date-fns";
import Link from "next/link";
import {
  addBannedSenderIdAction,
  banFlaggedSenderIdAction,
  removeBannedSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
import {
  sortBannedEntries,
  type AdminBannedSendersDashboard,
} from "@/lib/admin/sender-id-banned-types";
import type { BannedSenderSource } from "@/lib/sender-ids/reserved-names";
import {
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ban, Shield } from "lucide-react";

const SOURCE_LABEL: Record<BannedSenderSource, string> = {
  manual: "Manual",
  reject: "Denied",
  block: "Blocked",
};

type SenderIdBannedPanelProps = {
  dashboard: AdminBannedSendersDashboard;
  returnTo?: string;
};

export function SenderIdBannedPanel({
  dashboard,
  returnTo = "/admin/sender-ids?tab=banned",
}: SenderIdBannedPanelProps) {
  const banned = sortBannedEntries(dashboard.config.bannedEntries);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Admin banned"
          value={banned.length}
          variant="primary"
          hint="Blocks new registrations"
        />
        <AdminStatCard
          label="Built-in protected"
          value={dashboard.builtIn.builtInExactCount}
          hint="Telcos, banks, brands (always on)"
        />
        <AdminStatCard
          label="Flagged (not banned yet)"
          value={dashboard.flaggedRejected.length}
          variant={dashboard.flaggedRejected.length > 0 ? "warning" : "default"}
          hint="Denied requests you can add to ban list"
        />
      </div>

      <AdminCard
        title="Add to ban list"
        description="Banned names cannot be registered by any member. Built-in protected names (MTN, Google, etc.) are always blocked separately."
      >
        <form action={addBannedSenderIdAction} className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-2xl">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="space-y-2 flex-1 min-w-0">
            <Label htmlFor="ban-value">Sender ID</Label>
            <Input
              id="ban-value"
              name="value"
              required
              maxLength={11}
              placeholder="BADNAME"
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-2 flex-[2] min-w-0">
            <Label htmlFor="ban-reason">Reason (optional)</Label>
            <Input id="ban-reason" name="reason" placeholder="Impersonation / fraud" />
          </div>
          <Button type="submit" className="gap-2 shrink-0">
            <Ban className="h-4 w-4" />
            Ban name
          </Button>
        </form>
      </AdminCard>

      <AdminCard
        title="Banned sender IDs"
        description={
          banned.length === 0
            ? "No admin bans yet — denying or blocking a sender adds here automatically."
            : `${banned.length} name${banned.length === 1 ? "" : "s"} on the ban list`
        }
        actions={
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            {dashboard.builtIn.builtInPrefixCount} prefix rules active
          </Badge>
        }
      >
        {banned.length === 0 ? (
          <AdminEmpty>
            Ban a name manually above, or deny/block a sender ID request with “Add to ban list”
            checked.
          </AdminEmpty>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Sender ID</th>
                  <th className="py-2 pr-3 font-semibold">Reason</th>
                  <th className="py-2 pr-3 font-semibold">Source</th>
                  <th className="py-2 pr-3 font-semibold">Banned</th>
                  <th className="py-2 pr-3 font-semibold">By</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {banned.map((entry) => (
                  <tr key={entry.value} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-3 font-mono font-semibold">{entry.value}</td>
                    <td className="py-3 pr-3 text-muted-foreground max-w-[200px] truncate">
                      {entry.reason ?? "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant="outline" className="text-[10px]">
                        {SOURCE_LABEL[entry.source]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.bannedAt), "PP")}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {entry.actorName ?? "—"}
                    </td>
                    <td className="py-3 text-right">
                      <form action={removeBannedSenderIdAction}>
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <input type="hidden" name="value" value={entry.value} />
                        <Button type="submit" size="sm" variant="outline">
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {dashboard.flaggedRejected.length > 0 && (
        <AdminCard
          title="Flagged — denied but not on ban list"
          description="These sender IDs were rejected for a member but anyone could try the same name again unless you ban it."
        >
          <div className="space-y-3">
            {dashboard.flaggedRejected.map((row) => (
              <div
                key={row.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono font-semibold">{row.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Link href={`/admin/members/${row.user.id}?tab=senders`} className="text-primary hover:underline">
                      {row.user.fullName}
                    </Link>
                    {" · "}
                    {row.countryCode}
                    {row.adminNote ? ` · ${row.adminNote}` : ""}
                  </p>
                </div>
                <form action={banFlaggedSenderIdAction} className="shrink-0">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input type="hidden" name="senderId" value={row.id} />
                  <Button type="submit" size="sm" variant="secondary" className="gap-1">
                    <Ban className="h-3.5 w-3.5" />
                    Add to ban list
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  );
}
