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
  ExternalLink,
  Sparkles,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ResellerRow = AdminResellersDashboard["resellers"][number];

type Props = {
  data: AdminResellersDashboard;
  flash?: { saved?: string; error?: string };
  filter?: string;
};

function flashMessage(saved: string) {
  const map: Record<string, string> = {
    approved: "Reseller approved and portal access enabled.",
    rejected: "Application rejected.",
    suspended: "Reseller suspended.",
    reactivated: "Reseller reactivated.",
    created: "New reseller created from member account.",
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
  const wallet = r.user.wallet;

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
              <MetaChip icon={Users} label={`${r._count.subUsers} sub-users`} />
              <MetaChip
                icon={Wallet}
                label={`GHS ${r.commissionEarned.toFixed(2)} earned`}
              />
              {r.domain && (
                <MetaChip icon={Globe} label={r.domain} mono />
              )}
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
            <p className="text-[10px] text-muted-foreground mt-2">
              Joined {formatDistanceToNow(r.createdAt, { addSuffix: true })} ·{" "}
              {format(r.createdAt, "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end shrink-0 w-full sm:w-auto">
          {wallet && (
            <p className="text-xs text-muted-foreground text-right tabular-nums">
              Wallet {wallet.currency} {wallet.balance.toString()}
            </p>
          )}
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={`/admin/resellers/${r.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              Manage
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
                <Link
                  href="/reseller"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Portal
                </Link>
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

export function ResellersAdminView({ data, flash, filter }: Props) {
  const { stats, candidates, pending, approved, suspended } = data;

  const list =
    filter === "pending"
      ? pending
      : filter === "approved"
        ? approved
        : filter === "suspended"
          ? suspended
          : data.resellers;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Resellers"
        description="Partner accounts with sub-users, custom pricing, commissions, and optional white-label branding."
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total partners"
          value={stats.total}
          hint={`${stats.approved} active`}
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
          label="Sub-users"
          value={stats.totalSubUsers.toLocaleString()}
          icon={Users}
        />
        <AdminStatCard
        label="Commission accrued"
        hint="Unpaid + paid ledger"
        value={`GHS ${stats.totalCommissions.toFixed(2)}`}
          icon={Wallet}
        />
      </div>

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
          <div className="flex flex-wrap items-center gap-2">
            <FilterTab href="/admin/resellers" active={!filter} label="All" count={stats.total} />
            <FilterTab
              href="/admin/resellers?filter=pending"
              active={filter === "pending"}
              label="Pending"
              count={stats.pending}
              highlight={stats.pending > 0}
            />
            <FilterTab
              href="/admin/resellers?filter=approved"
              active={filter === "approved"}
              label="Approved"
              count={stats.approved}
            />
            <FilterTab
              href="/admin/resellers?filter=suspended"
              active={filter === "suspended"}
              label="Suspended"
              count={stats.suspended}
            />
          </div>

          {stats.pending > 0 && filter !== "pending" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>
                  <strong>{stats.pending}</strong> application
                  {stats.pending !== 1 ? "s" : ""} awaiting review
                </span>
              </div>
              <Link
                href="/admin/resellers?filter=pending"
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
                    : "All resellers"
            }
            description={`${list.length} shown`}
          >
            {list.length === 0 ? (
              <AdminEmpty>
                {filter
                  ? "No resellers in this category."
                  : "No reseller accounts yet. Create one from a member."}
              </AdminEmpty>
            ) : (
              <div className="space-y-4">
                {list.map((r) => (
                  <ResellerCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </AdminCard>

          <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              Partners configure logos & colors in the reseller portal
            </span>
            <span className="inline-flex items-center gap-1">
              <Ban className="h-3.5 w-3.5" />
              Suspending blocks portal access; sub-users stop earning commissions
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
