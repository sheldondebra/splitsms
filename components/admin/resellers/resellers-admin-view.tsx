import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminAlert,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import { StatusPill } from "@/components/admin/member-detail/member-detail-ui";
import { ResellerAdminCharts } from "@/components/admin/resellers/reseller-admin-charts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  approveResellerAction,
  suspendResellerAction,
  rejectResellerAction,
  reactivateResellerAction,
  createResellerFromUserAction,
} from "@/lib/actions/admin-resellers";
import { startResellerImpersonationAction } from "@/lib/actions/admin-impersonation";
import {
  getResellerClientLoginHref,
  getResellerOwnerAdminHref,
} from "@/lib/admin/reseller-portal-url";
import type { AdminResellersDashboard } from "@/lib/admin/resellers-dashboard";
import {
  Store,
  Users,
  Percent,
  Wallet,
  Globe,
  Palette,
  UserPlus,
  CheckCircle2,
  Clock,
  Ban,
  Settings2,
  MessageSquare,
  Tags,
  Activity,
  Coins,
  LayoutGrid,
  Table2,
  Trophy,
  UserRound,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ResellerRow = AdminResellersDashboard["resellers"][number];

type Props = {
  data: AdminResellersDashboard;
  flash?: { saved?: string; error?: string };
  filter?: string;
  view?: string;
};

function flashMessage(saved: string) {
  const map: Record<string, string> = {
    approved: "Reseller approved and portal access enabled.",
    rejected: "Application rejected.",
    suspended: "Reseller suspended. Portal and commission earning are blocked.",
    reactivated: "Reseller reactivated.",
    created: "New reseller created from member account.",
    deleted: "Reseller account deleted. Owner was demoted to member.",
  };
  return map[saved] ?? "Changes saved.";
}

function ResellerAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-primary/10 border border-primary/15 text-sm font-bold text-primary">
      {initials}
    </div>
  );
}

function ResellerCard({ r }: { r: ResellerRow }) {
  const rate = r.commissionRate.toNumber();
  const pricingPreview = r.countryPricing ?? [];
  const loginHref = getResellerClientLoginHref(r.domain);
  const ownerHref = getResellerOwnerAdminHref(r.userId);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
        r.status === "PENDING" && "border-amber-500/35 ring-1 ring-amber-500/10",
        r.status === "APPROVED" && "border-border/60",
        (r.status === "SUSPENDED" || r.status === "REJECTED") && "border-destructive/25 opacity-90",
      )}
    >
      <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4 min-w-0 flex-1">
          <ResellerAvatar name={r.businessName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base truncate">{r.businessName}</h3>
              <StatusPill status={r.status} />
              {r.performanceRank != null && r.performanceRank <= 10 && (
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-200">
                  <Trophy className="h-3 w-3 mr-1" />
                  #{r.performanceRank}
                </Badge>
              )}
              {!r.isActive && r.status === "APPROVED" && (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </div>
            {r.brandName && (
              <p className="text-xs text-muted-foreground mt-0.5">Brand: {r.brandName}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {r.user.fullName} · <span className="font-mono text-xs">{r.user.phone}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <MetaChip icon={Percent} label={`${rate}% commission`} />
              <MetaChip
                icon={Users}
                label={`${r._count.subUsers} clients${r.suspendedSubUsers ? ` · ${r.suspendedSubUsers} suspended` : ""}`}
              />
              <MetaChip icon={Wallet} label={`GHS ${r.commissionEarned.toFixed(2)} earned`} />
              <MetaChip
                icon={MessageSquare}
                label={`${r.smsLast30Days.toLocaleString()} SMS · 30d`}
              />
              <MetaChip
                icon={Coins}
                label={`Owner GHS ${r.ownerWalletBalance.toFixed(2)} · Clients GHS ${r.clientsWalletBalance.toFixed(2)}`}
              />
              <MetaChip
                icon={Tags}
                label={
                  r._count.countryPricing > 0
                    ? `${r._count.countryPricing} price routes`
                    : "Platform defaults"
                }
              />
              {r.domain && <MetaChip icon={Globe} label={r.domain} mono />}
              {r.branding?.primaryColor && (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-0.5 text-[10px]"
                  title="Brand color"
                >
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: r.branding.primaryColor }}
                  />
                  White-label
                </span>
              )}
            </div>

            {r.badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.badges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="text-[10px] border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-200"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            )}

            {pricingPreview.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pricingPreview.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium"
                  >
                    <span className="font-mono font-semibold">{p.countryCode}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.currency} {Number(p.sellPrice).toFixed(2)}
                    </span>
                  </span>
                ))}
                {r._count.countryPricing > pricingPreview.length && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{r._count.countryPricing - pricingPreview.length} more
                  </span>
                )}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground mt-2">
              Joined {formatDistanceToNow(r.createdAt, { addSuffix: true })} ·{" "}
              {format(r.createdAt, "MMM d, yyyy")}
              {r.spendLast30Days > 0 && (
                <> · Spend 30d GHS {r.spendLast30Days.toFixed(2)}</>
              )}
              {r.performanceScore > 0 && <> · Score {r.performanceScore.toFixed(1)}</>}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end shrink-0 w-full sm:w-auto">
          <div className="text-right text-xs text-muted-foreground space-y-0.5 tabular-nums">
            <p>
              Credits {r.ownerSmsCredits.toLocaleString()}
              {r.clientsSmsCredits > 0 && (
                <span className="text-muted-foreground/80">
                  {" "}
                  · clients {r.clientsSmsCredits.toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={`/admin/resellers/${r.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              Manage
            </Link>
            <Link
              href={ownerHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <UserRound className="h-3.5 w-3.5 mr-1" />
              Owner
            </Link>
            {r.status === "PENDING" && (
              <>
                <form action={approveResellerAction} className="flex items-center gap-2">
                  <input type="hidden" name="resellerId" value={r.id} />
                  <div className="flex items-center gap-1">
                    <Label htmlFor={`rate-${r.id}`} className="sr-only">
                      Commission %
                    </Label>
                    <Input
                      id={`rate-${r.id}`}
                      name="commissionRate"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      defaultValue={rate}
                      className="h-9 w-16 text-xs tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Button type="submit" size="sm">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                </form>
                <form action={rejectResellerAction}>
                  <input type="hidden" name="resellerId" value={r.id} />
                  <Button type="submit" size="sm" variant="outline" className="text-destructive">
                    Reject
                  </Button>
                </form>
              </>
            )}
            {r.status === "APPROVED" && (
              <>
                <form action={startResellerImpersonationAction}>
                  <input type="hidden" name="resellerId" value={r.id} />
                  <Button type="submit" size="sm" variant="outline">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Portal
                  </Button>
                </form>
                {loginHref && (
                  <Link
                    href={loginHref}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Client login
                  </Link>
                )}
                <form action={suspendResellerAction}>
                  <input type="hidden" name="resellerId" value={r.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                    Suspend
                  </Button>
                </form>
              </>
            )}
            {(r.status === "SUSPENDED" || r.status === "REJECTED") && (
              <form action={reactivateResellerAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <Button type="submit" size="sm" variant="secondary">
                  Reactivate
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function FundsTable({ rows }: { rows: ResellerRow[] }) {
  const sorted = [...rows].sort(
    (a, b) =>
      b.totalFundsUnderManagement - a.totalFundsUnderManagement ||
      b.commissionEarned - a.commissionEarned,
  );

  if (sorted.length === 0) {
    return <AdminEmpty>No resellers to show.</AdminEmpty>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[980px]">
        <thead>
          <tr className="text-left text-[11px] text-muted-foreground border-b border-border/50">
            <th className="pb-2 pr-3 font-medium">Partner</th>
            <th className="pb-2 pr-3 font-medium">Status</th>
            <th className="pb-2 pr-3 font-medium text-right">Owner wallet</th>
            <th className="pb-2 pr-3 font-medium text-right">Client wallets</th>
            <th className="pb-2 pr-3 font-medium text-right">Owner credits</th>
            <th className="pb-2 pr-3 font-medium text-right">Client credits</th>
            <th className="pb-2 pr-3 font-medium text-right">Clients</th>
            <th className="pb-2 pr-3 font-medium text-right">SMS 30d</th>
            <th className="pb-2 pr-3 font-medium text-right">Commission</th>
            <th className="pb-2 font-medium text-right">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-muted/20">
              <td className="py-3 pr-3">
                <Link
                  href={`/admin/resellers/${r.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {r.businessName}
                </Link>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.user.phone}</p>
              </td>
              <td className="py-3 pr-3">
                <StatusPill status={r.status} />
              </td>
              <td className="py-3 pr-3 text-right tabular-nums">
                GHS {r.ownerWalletBalance.toFixed(2)}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                GHS {r.clientsWalletBalance.toFixed(2)}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums">
                {r.ownerSmsCredits.toLocaleString()}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                {r.clientsSmsCredits.toLocaleString()}
              </td>
              <td className="py-3 pr-3 text-right tabular-nums">{r._count.subUsers}</td>
              <td className="py-3 pr-3 text-right tabular-nums">{r.smsLast30Days.toLocaleString()}</td>
              <td className="py-3 pr-3 text-right tabular-nums">
                GHS {r.commissionEarned.toFixed(2)}
              </td>
              <td className="py-3 text-right tabular-nums font-semibold">
                {r.performanceRank != null ? (
                  <span title={`Rank #${r.performanceRank}`}>{r.performanceScore.toFixed(1)}</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  mono,
}: {
  icon: typeof Users;
  label: string;
  mono?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-muted/40 border border-border/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0 opacity-70" />
      <span className={cn(mono && "font-mono truncate max-w-[140px]")}>{label}</span>
    </span>
  );
}

function PlatformPricingPanel({
  pricing,
}: {
  pricing: AdminResellersDashboard["platformPricing"];
}) {
  if (pricing.length === 0) {
    return (
      <AdminCard title="Platform wholesale rates" description="Reseller cost basis by country">
        <AdminEmpty>No active SMS pricing routes configured.</AdminEmpty>
      </AdminCard>
    );
  }

  return (
    <AdminCard
      title="Platform wholesale rates"
      description={`${pricing.length} active routes · member vs reseller cost`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border/50">
              <th className="pb-2 pr-3 font-medium">Country</th>
              <th className="pb-2 pr-3 font-medium text-right">Member</th>
              <th className="pb-2 pr-3 font-medium text-right">Reseller</th>
              <th className="pb-2 pr-3 font-medium text-right">Cost</th>
              <th className="pb-2 font-medium text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {pricing.map((p) => {
              const margin = p.resellerPrice - p.costPrice;
              return (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{p.countryName}</span>
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                      {p.countryCode}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                    {p.currency} {p.memberPrice.toFixed(3)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">
                    {p.currency} {p.resellerPrice.toFixed(3)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                    {p.currency} {p.costPrice.toFixed(3)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-right tabular-nums text-xs font-medium",
                      margin >= 0 ? "text-emerald-600" : "text-destructive",
                    )}
                  >
                    {p.currency} {margin.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}

function viewHref(view: string, filter?: string) {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (view === "table") params.set("view", "table");
  const q = params.toString();
  return q ? `/admin/resellers?${q}` : "/admin/resellers";
}

export function ResellersAdminView({ data, flash, filter, view }: Props) {
  const { stats, candidates, pending, approved, suspended, charts, platformPricing } = data;
  const isTable = view === "table";

  const list =
    filter === "pending"
      ? pending
      : filter === "approved"
        ? approved
        : filter === "suspended"
          ? suspended
          : filter === "top"
            ? [...approved].sort(
                (a, b) =>
                  b.performanceScore - a.performanceScore ||
                  b.commissionEarned - a.commissionEarned,
              )
            : data.resellers;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Resellers"
        description="Partner accounts with wallets, client funds, commissions, promos, and white-label portals."
        icon={Store}
      />

      {flash?.saved && (
        <AdminAlert variant="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {flashMessage(flash.saved)}
          </div>
        </AdminAlert>
      )}
      {flash?.error === "name" && (
        <AdminAlert variant="warning">Business name is required.</AdminAlert>
      )}
      {flash?.error === "delete_confirm" && (
        <AdminAlert variant="warning">
          Type DELETE exactly to confirm permanent reseller removal.
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard
          label="Total partners"
          value={stats.total}
          hint={`${stats.approved} approved`}
          icon={Store}
          variant="primary"
        />
        <AdminStatCard
          label="Pending review"
          value={stats.pending}
          icon={Clock}
          variant={stats.pending > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="Active clients"
          value={stats.activeSubUsers.toLocaleString()}
          hint={`${stats.totalSubUsers} total`}
          icon={Users}
        />
        <AdminStatCard
          label="Partner wallets"
          value={`GHS ${stats.totalOwnerWallets.toFixed(0)}`}
          hint={`Clients GHS ${stats.totalClientWallets.toFixed(0)}`}
          icon={Wallet}
        />
        <AdminStatCard
          label="SMS credits"
          value={stats.totalCreditsUnderManagement.toLocaleString()}
          hint={`Owners ${stats.totalOwnerCredits.toLocaleString()} · clients ${stats.totalClientCredits.toLocaleString()}`}
          icon={Coins}
        />
        <AdminStatCard
          label="Commission accrued"
          hint={`SMS 30d ${stats.totalSms30d.toLocaleString()}`}
          value={`GHS ${stats.totalCommissions.toFixed(2)}`}
          icon={Activity}
        />
      </div>

      <ResellerAdminCharts charts={charts} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_1fr]">
        <AdminCard
          title="Create reseller"
          description="Promote an existing member to a partner account"
          className="h-fit xl:sticky xl:top-20"
        >
          {candidates.length === 0 ? (
            <AdminEmpty>No eligible members without a reseller account.</AdminEmpty>
          ) : (
            <form action={createResellerFromUserAction} className="space-y-4">
              <div className="space-y-2">
                <Label>Member</Label>
                <select
                  name="userId"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select member…</option>
                  {candidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} · {m.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input name="businessName" required placeholder="Agency Ltd" />
              </div>
              <div className="space-y-2">
                <Label>Brand name (optional)</Label>
                <Input name="brandName" placeholder="Shown in white-label UI" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Commission %</Label>
                  <Input
                    name="commissionRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    defaultValue={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custom domain</Label>
                  <Input name="domain" placeholder="sms.partner.com" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Create & approve
              </Button>
            </form>
          )}
        </AdminCard>

        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <FilterTab href={viewHref(view ?? "", undefined)} active={!filter} label="All" count={stats.total} />
              <FilterTab
                href={viewHref(view ?? "", "pending")}
                active={filter === "pending"}
                label="Pending"
                count={stats.pending}
                highlight={stats.pending > 0}
              />
              <FilterTab
                href={viewHref(view ?? "", "approved")}
                active={filter === "approved"}
                label="Approved"
                count={stats.approved}
              />
              <FilterTab
                href={viewHref(view ?? "", "top")}
                active={filter === "top"}
                label="Top performers"
                count={Math.min(stats.approved, 10)}
              />
              <FilterTab
                href={viewHref(view ?? "", "suspended")}
                active={filter === "suspended"}
                label="Suspended"
                count={stats.suspended}
              />
            </div>
            <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
              <Link
                href={viewHref("cards", filter)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold",
                  !isTable ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </Link>
              <Link
                href={viewHref("table", filter)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold",
                  isTable ? "bg-background shadow-sm text-foreground" : "text-muted-foreground",
                )}
              >
                <Table2 className="h-3.5 w-3.5" />
                Funds table
              </Link>
            </div>
          </div>

          {stats.pending > 0 && filter !== "pending" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>
                  <strong>{stats.pending}</strong> application
                  {stats.pending !== 1 ? "s" : ""} awaiting review
                </span>
              </div>
              <Link
                href={viewHref(view ?? "", "pending")}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Review now
              </Link>
            </div>
          )}

          <AdminCard
            title={
              filter === "pending"
                ? "Pending applications"
                : filter === "approved"
                  ? "Approved partners"
                  : filter === "suspended"
                    ? "Suspended & rejected"
                    : filter === "top"
                      ? "Top performing partners"
                      : isTable
                        ? "Reseller funds overview"
                        : "All resellers"
            }
            description={
              isTable
                ? `${list.length} partners · Owner + client wallets and SMS credits`
                : `${list.length} shown · Manage opens settings, clients, bonus credits & portal`
            }
          >
            {list.length === 0 ? (
              <AdminEmpty>
                {filter
                  ? "No resellers in this category."
                  : "No reseller accounts yet. Create one from a member."}
              </AdminEmpty>
            ) : isTable ? (
              <FundsTable rows={list} />
            ) : (
              <div className="space-y-4">
                {list.map((r) => (
                  <ResellerCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </AdminCard>

          <PlatformPricingPanel pricing={platformPricing} />

          <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              Portal opens the partner account as staff (impersonation); Owner opens their admin member account
            </span>
            <span className="inline-flex items-center gap-1">
              <Ban className="h-3.5 w-3.5" />
              Suspend blocks portal access; delete removes the partner account permanently
            </span>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

function FilterTab({
  href,
  active,
  label,
  count,
  highlight,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        highlight && !active && "ring-1 ring-amber-500/40",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums rounded-full px-1.5 py-0.5 text-[10px]",
          active ? "bg-primary-foreground/20" : "bg-background/80",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
