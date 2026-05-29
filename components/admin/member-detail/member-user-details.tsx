import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { InfoRow } from "@/components/admin/member-detail/member-detail-ui";
import { ProviderBadge } from "@/components/admin/provider-badge";
import { Badge } from "@/components/ui/badge";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { Link2, Puzzle, Store, Globe, UserPlus } from "lucide-react";

const SOURCE_ICONS = {
  connect: Link2,
  wordpress: Puzzle,
  reseller: Store,
  direct: UserPlus,
} as const;

export function MemberUserDetails({ data }: { data: AdminMemberDetail }) {
  const { user, account, connect, acquisition, analytics, counts } = data;
  const SourceIcon = SOURCE_ICONS[acquisition.source];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AdminCard title="User details" className="lg:col-span-2">
        <div className="grid gap-0 sm:grid-cols-2">
          <div>
            <InfoRow label="Full name" value={user.fullName} />
            <InfoRow label="Phone" value={user.phone} mono />
            <InfoRow label="Email" value={user.email ?? "—"} />
            <InfoRow label="Country" value={`${user.countryName} (${user.countryCode})`} />
          </div>
          <div>
            <InfoRow
              label="Joined"
              value={
                <>
                  {format(user.createdAt, "PP")}
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                  </span>
                </>
              }
            />
            <InfoRow label="Referral code" value={user.referralCode ?? "—"} mono />
            <InfoRow
              label="Acquisition"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {acquisition.sourceLabel}
                </span>
              }
            />
            {account.assignedProvider && (
              <InfoRow
                label="Provider lock"
                value={<ProviderBadge type={account.assignedProvider as SmsProviderType} />}
              />
            )}
          </div>
        </div>

        {connect && (
          <div className="mt-4 rounded-lg border border-violet-500/25 bg-violet-500/5 p-3 text-sm">
            <p className="font-semibold text-violet-800 dark:text-violet-200 flex items-center gap-1.5">
              <Link2 className="h-4 w-4" />
              Connect customer
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Partner:{" "}
              <Link href={`/admin/members/${connect.partnerId}`} className="underline font-medium">
                {connect.partnerName}
              </Link>
              {" · "}
              {connect.partnerPhone}
            </p>
            {connect.externalRef && (
              <p className="text-xs font-mono mt-1">external_ref: {connect.externalRef}</p>
            )}
            {connect.label && connect.label !== user.fullName && (
              <p className="text-xs mt-1">Label: {connect.label}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              Provisioned {format(connect.createdAt, "PPp")}
            </p>
          </div>
        )}

        {data.resellerMembership && (
          <p className="mt-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" />
            Reseller: {data.resellerMembership.reseller.businessName}
          </p>
        )}

        {data.wordpressSites.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-sky-800 dark:text-sky-200">
              <Puzzle className="h-3.5 w-3.5" />
              WordPress sites
            </p>
            {data.wordpressSites.map((s) => (
              <p key={s.id} className="text-xs text-muted-foreground font-mono truncate">
                {s.siteUrl}
                {s.pluginVersion && ` · v${s.pluginVersion}`}
              </p>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Usage snapshot">
        <InfoRow label="SMS credits" value={data.smsCredit?.balance ?? 0} />
        <InfoRow
          label="Messages"
          value={`${counts.messages.toLocaleString()} (${counts.failedMessages} failed)`}
        />
        <InfoRow label="Campaigns" value={counts.campaigns} />
        <InfoRow
          label="Sender IDs"
          value={
            <>
              {counts.senderIds} / {account.maxSenderIds}
              {account.senderIdsBlocked && (
                <Badge variant="destructive" className="ml-2 text-[10px]">
                  Blocked
                </Badge>
              )}
            </>
          }
        />
        <InfoRow label="API keys" value={counts.apiKeys} />
        <InfoRow label="API requests" value={counts.apiLogs.toLocaleString()} />
        <InfoRow label="Avg delivery" value={analytics.avgDeliverySec != null ? `${analytics.avgDeliverySec}s` : "—"} />
        <InfoRow label="Failure rate" value={`${analytics.failureRate}%`} />

        {analytics.providerChart.length > 0 && (
          <div className="pt-3 mt-2 border-t border-border/40">
            <p className="text-xs font-semibold text-muted-foreground mb-2">By provider</p>
            <ul className="space-y-1">
              {analytics.providerChart.map((p) => (
                <li key={p.provider} className="flex justify-between text-xs">
                  <ProviderBadge type={p.provider as SmsProviderType} />
                  <span className="tabular-nums font-medium">{p.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.webhooks.length > 0 && (
          <div className="pt-3 mt-2 border-t border-border/40">
            <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Webhooks
            </p>
            {data.webhooks.map((w) => (
              <p key={w.id} className="text-[10px] text-muted-foreground truncate">
                {w.url}
              </p>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
