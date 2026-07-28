import { Eye, Link2, MousePointerClick, UserPlus, Users } from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import { ResellerCard, ResellerStatCard } from "@/components/reseller/reseller-page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResellerInviteStats } from "@/lib/reseller/invite-analytics";

function formatRelativeTime(value: Date | string | null): string {
  if (!value) return "No activity yet";
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function ResellerSignupLinkPanel({
  shareUrl,
  domainUrl,
  stats,
  compact = false,
}: {
  shareUrl: string;
  domainUrl?: string | null;
  stats: ResellerInviteStats;
  compact?: boolean;
}) {
  return (
    <ResellerCard
      title="Client signup link"
      description={
        compact
          ? "Share this link and track views, signups, and conversion."
          : "Share this link so new clients can create their own accounts under your brand."
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ResellerStatCard
            label="Link views"
            value={stats.linkViews.toLocaleString()}
            hint={
              stats.domainViews > 0
                ? `${stats.shareViews} share · ${stats.domainViews} domain`
                : stats.lastViewedAt
                  ? `Last viewed ${formatRelativeTime(stats.lastViewedAt)}`
                  : "Opens of your signup link"
            }
            accent
          />
          <ResellerStatCard
            label="Signups"
            value={stats.signups.toLocaleString()}
            hint={
              stats.pendingSignups > 0
                ? `${stats.verifiedSignups} verified · ${stats.pendingSignups} pending OTP`
                : stats.lastSignupAt
                  ? `Last signup ${formatRelativeTime(stats.lastSignupAt)}`
                  : "Accounts created via link"
            }
          />
          <ResellerStatCard
            label="Conversion"
            value={stats.conversionRate != null ? `${stats.conversionRate}%` : "—"}
            hint="Signups ÷ link views"
          />
          <ResellerStatCard
            label="Last 7 days"
            value={stats.signupsLast7Days.toLocaleString()}
            hint="New signups from your link"
          />
        </div>

        <div className="space-y-2">
          <Label className="inline-flex items-center gap-1.5">
            <Link2 className="size-3.5" />
            Shareable signup URL
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              readOnly
              value={shareUrl}
              title={shareUrl}
              className="font-mono text-xs sm:text-sm truncate"
            />
            <CopyButton value={shareUrl} label="Copy link" className="shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Works even without a custom domain. Anyone who signs up through this link becomes your
            client.
          </p>
        </div>

        {domainUrl ? (
          <div className="space-y-2">
            <Label className="inline-flex items-center gap-1.5">
              <MousePointerClick className="size-3.5" />
              Domain signup URL
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={domainUrl}
                title={domainUrl}
                className="font-mono text-xs sm:text-sm truncate"
              />
              <CopyButton value={domainUrl} label="Copy link" className="shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Branded hostname signups are tracked separately under domain views.
            </p>
          </div>
        ) : null}

        {stats.linkViews === 0 && stats.signups === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Eye className="size-3.5" />
              No activity yet
            </span>
            <span className="mt-1 block">
              Copy the link and share it on WhatsApp, email, or your website. Views and signups
              appear here automatically.
            </span>
          </div>
        ) : null}
      </div>
    </ResellerCard>
  );
}

export function ResellerSignupLinkCompact({
  shareUrl,
  stats,
}: {
  shareUrl: string;
  stats: ResellerInviteStats;
}) {
  return (
    <ResellerCard
      title="Share signup link"
      description="Let clients self-register — track views and signups below."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
            <code className="truncate font-mono text-xs sm:text-sm" title={shareUrl}>
              {shareUrl}
            </code>
          </div>
          <CopyButton value={shareUrl} label="Copy link" className="shrink-0" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <Eye className="size-3 h-3" />
              Views
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">{stats.linkViews.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <UserPlus className="size-3 h-3" />
              Signups
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">{stats.signups.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
              <Users className="size-3 h-3" />
              7-day
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {stats.signupsLast7Days.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </ResellerCard>
  );
}
