import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { DetailTile, InfoRow } from "@/components/admin/member-detail/member-detail-ui";
import { ProviderBadge } from "@/components/admin/provider-badge";
import { Badge } from "@/components/ui/badge";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Globe,
  Link2,
  Mail,
  MapPin,
  Phone,
  Puzzle,
  Store,
  Tag,
  UserPlus,
  Zap,
} from "lucide-react";

const SOURCE_ICONS = {
  connect: Link2,
  wordpress: Puzzle,
  reseller: Store,
  direct: UserPlus,
} as const;

function ContactChip({
  icon: Icon,
  value,
  mono,
}: {
  icon: typeof Phone;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 min-w-0 max-w-full">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className={cn("text-xs font-medium truncate", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function UsageStatsBar({ data }: { data: AdminMemberDetail }) {
  const { counts, account, analytics, smsCredit } = data;
  const items = [
    {
      label: "SMS credits",
      value: (smsCredit?.balance ?? 0).toLocaleString(),
      hot: true,
    },
    {
      label: "Messages",
      value: counts.messages.toLocaleString(),
      hint: `${counts.failedMessages} failed`,
    },
    {
      label: "Campaigns",
      value: counts.campaigns.toLocaleString(),
    },
    {
      label: "Sender IDs",
      value: `${counts.senderIds}/${account.maxSenderIds}`,
      hint: account.senderIdsBlocked ? "Blocked" : undefined,
      warn: account.senderIdsBlocked,
    },
    {
      label: "Failure rate",
      value: `${analytics.failureRate}%`,
      hint: analytics.avgDeliverySec != null ? `${analytics.avgDeliverySec}s avg` : undefined,
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, hint, hot, warn }) => (
          <div
            key={label}
            className={cn(
              "px-3 py-2.5 min-w-0",
              hot && "bg-primary/[0.04]",
              warn && "bg-destructive/[0.04]",
            )}
          >
            <p
              className={cn(
                "text-base font-bold tabular-nums leading-none truncate",
                hot && "text-primary",
                warn && "text-destructive",
              )}
            >
              {value}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">
              {label}
              {hint ? ` · ${hint}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberUserDetails({ data }: { data: AdminMemberDetail }) {
  const { user, account, connect, acquisition, analytics, counts } = data;
  const SourceIcon = SOURCE_ICONS[acquisition.source];

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
      <AdminCard title="Profile & account" dense className="lg:col-span-2">
        <div className="flex flex-wrap gap-2 mb-4">
          <ContactChip icon={Phone} value={user.phone} mono />
          <ContactChip icon={Mail} value={user.email ?? "No email on file"} />
          <ContactChip icon={MapPin} value={`${user.countryName} (${user.countryCode})`} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <DetailTile
            label="Member since"
            icon={Calendar}
            value={format(user.createdAt, "MMM d, yyyy")}
            hint={formatDistanceToNow(user.createdAt, { addSuffix: true })}
          />
          <DetailTile
            label="Referral"
            icon={Tag}
            value={user.referralCode ?? "—"}
            mono
          />
          <DetailTile
            label="Acquisition"
            icon={SourceIcon}
            value={acquisition.sourceLabel}
          />
          <DetailTile
            label="Account"
            icon={UserPlus}
            value={account.status}
            hint={user.isVerified ? "Verified" : "Unverified"}
          />
        </div>

        {account.assignedProvider && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Provider lock
            </span>
            <ProviderBadge type={account.assignedProvider as SmsProviderType} />
          </div>
        )}

        {connect && (
          <div className="mt-3 rounded-lg border border-violet-500/25 bg-violet-500/5 p-3">
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Connect customer
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Partner:{" "}
                <Link
                  href={`/admin/members/${connect.partnerId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {connect.partnerName}
                </Link>
              </span>
              <span>{connect.partnerPhone}</span>
              {connect.externalRef && (
                <span className="font-mono text-[10px]">ref: {connect.externalRef}</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Provisioned {format(connect.createdAt, "PPp")}
            </p>
          </div>
        )}

        {(data.resellerMembership || data.wordpressSites.length > 0) && (
          <div className="mt-3 flex flex-col gap-2">
            {data.resellerMembership && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                <Store className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300 shrink-0" />
                <span>
                  Reseller:{" "}
                  <span className="font-medium">{data.resellerMembership.reseller.businessName}</span>
                </span>
              </div>
            )}
            {data.wordpressSites.length > 0 && (
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                <p className="text-xs font-semibold flex items-center gap-1.5 text-sky-800 dark:text-sky-200">
                  <Puzzle className="h-3.5 w-3.5" />
                  WordPress ({data.wordpressSites.length})
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {data.wordpressSites.slice(0, 3).map((s) => (
                    <li key={s.id} className="text-[10px] text-muted-foreground font-mono truncate">
                      {s.siteUrl}
                      {s.pluginVersion && ` · v${s.pluginVersion}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </AdminCard>

      <div className="space-y-4">
        <UsageStatsBar data={data} />

        <AdminCard title="More metrics" dense>
          <InfoRow label="API keys" value={counts.apiKeys} compact />
          <InfoRow label="API requests" value={counts.apiLogs.toLocaleString()} compact />
          <InfoRow
            label="Sender IDs"
            value={
              <span className="inline-flex items-center gap-1.5">
                {counts.senderIds} / {account.maxSenderIds}
                {account.senderIdsBlocked && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                    Blocked
                  </Badge>
                )}
              </span>
            }
            compact
          />

          {analytics.providerChart.length > 0 && (
            <div className="pt-3 mt-1 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                By provider
              </p>
              <ul className="space-y-1.5">
                {analytics.providerChart.map((p) => (
                  <li key={p.provider} className="flex items-center justify-between gap-2 text-xs">
                    <ProviderBadge type={p.provider as SmsProviderType} />
                    <span className="tabular-nums font-semibold">{p.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.webhooks.length > 0 && (
            <div className="pt-3 mt-1 border-t border-border/40">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Webhooks
              </p>
              {data.webhooks.map((w) => (
                <p key={w.id} className="text-[10px] text-muted-foreground truncate font-mono">
                  {w.url}
                </p>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
