import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { getAdminResellerDetail } from "@/lib/admin/reseller-detail";
import {
  AdminPage,
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { StatusPill } from "@/components/admin/member-detail/member-detail-ui";
import {
  approveResellerAction,
  rejectResellerAction,
  suspendResellerAction,
  reactivateResellerAction,
  updateResellerSettingsAction,
  adminPayoutCommissionsAction,
} from "@/lib/actions/admin-resellers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TenantDnsGuide } from "@/components/tenant/tenant-dns-guide";
import {
  ArrowLeft,
  Users,
  Wallet,
  Percent,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminResellerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const { reseller, unpaidCommissions, paidCommissions, smsLast30Days } =
    await getAdminResellerDetail(id);
  const r = reseller;
  const wallet = r.user.wallet;

  return (
    <AdminPage wide>
      <Link
        href="/admin/resellers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Resellers
      </Link>

      {q.saved && (
        <AdminAlert variant="success">
          <CheckCircle2 className="h-4 w-4 inline mr-2" />
          {q.saved === "payout"
            ? "Unpaid commissions transferred to reseller wallet."
            : q.saved === "updated"
              ? "Settings saved."
              : "Action completed."}
        </AdminAlert>
      )}
      {q.error === "payout" && (
        <AdminAlert variant="warning">No unpaid commissions to payout.</AdminAlert>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{r.businessName}</h1>
              <StatusPill status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {r.user.fullName} · <span className="font-mono">{r.user.phone}</span>
            </p>
            {r.domain && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {r.domain}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {r.status === "PENDING" && (
              <>
                <form action={approveResellerAction} className="flex items-center gap-2">
                  <input type="hidden" name="resellerId" value={r.id} />
                  <Input
                    name="commissionRate"
                    type="number"
                    defaultValue={r.commissionRate.toNumber()}
                    className="h-9 w-16 text-xs"
                  />
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form action={rejectResellerAction}>
                  <input type="hidden" name="resellerId" value={r.id} />
                  <Button type="submit" size="sm" variant="destructive">
                    Reject
                  </Button>
                </form>
              </>
            )}
            {r.status === "APPROVED" && (
              <form action={suspendResellerAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <Button type="submit" size="sm" variant="outline" className="text-destructive">
                  Suspend
                </Button>
              </form>
            )}
            {(r.status === "SUSPENDED" || r.status === "REJECTED") && (
              <form action={reactivateResellerAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <Button type="submit" size="sm">
                  Reactivate
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Unpaid commission"
          value={`GHS ${unpaidCommissions.toFixed(2)}`}
          icon={Wallet}
          variant={unpaidCommissions > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="Paid out (all time)"
          value={`GHS ${paidCommissions.toFixed(2)}`}
          icon={CheckCircle2}
        />
        <AdminStatCard
          label="Sub-users"
          value={r._count.subUsers}
          icon={Users}
        />
        <AdminStatCard
          label="SMS (30d)"
          value={smsLast30Days.toLocaleString()}
          hint={`${r.commissionRate.toNumber()}% of margin`}
          icon={Percent}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Partner settings">
          <form action={updateResellerSettingsAction} className="space-y-4 max-w-md">
            <input type="hidden" name="resellerId" value={r.id} />
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input name="businessName" defaultValue={r.businessName} required />
            </div>
            <div className="space-y-2">
              <Label>Brand name</Label>
              <Input name="brandName" defaultValue={r.brandName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Custom domain</Label>
              <Input name="domain" defaultValue={r.domain ?? ""} placeholder="sms.partner.com" />
              <TenantDnsGuide domain={r.domain} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Commission %</Label>
                <Input
                  name="commissionRate"
                  type="number"
                  step={0.5}
                  defaultValue={r.commissionRate.toNumber()}
                />
              </div>
              <div className="space-y-2">
                <Label>Daily SMS cap (0 = unlimited)</Label>
                <Input
                  name="dailySmsLimit"
                  type="number"
                  defaultValue={r.dailySmsLimit ?? 0}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" value="1" defaultChecked={r.isActive} />
              Account active
            </label>
            <Button type="submit">Save settings</Button>
          </form>
        </AdminCard>

        <AdminCard title="Wallet & commissions">
          <p className="text-sm text-muted-foreground mb-4">
            Wallet balance:{" "}
            <strong className="text-foreground tabular-nums">
              {wallet ? `${wallet.currency} ${wallet.balance.toString()}` : "—"}
            </strong>
          </p>
          {unpaidCommissions > 0 ? (
            <form action={adminPayoutCommissionsAction}>
              <input type="hidden" name="resellerId" value={r.id} />
              <Button type="submit" className="w-full">
                Pay out GHS {unpaidCommissions.toFixed(2)} to wallet
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">No unpaid commission balance.</p>
          )}
          {r.branding && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs font-semibold mb-2">White-label</p>
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded-full border"
                  style={{ backgroundColor: r.branding.primaryColor ?? "#f97316" }}
                />
                <span className="text-xs text-muted-foreground">
                  {r.branding.supportEmail ?? "No support email"}
                </span>
              </div>
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Country pricing" description={`${r.countryPricing.length} routes`}>
        {r.countryPricing.length === 0 ? (
          <AdminEmpty>Reseller uses platform default sell prices until they set pricing.</AdminEmpty>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {r.countryPricing.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border/50 px-3 py-2 text-sm flex justify-between"
              >
                <span className="font-mono font-semibold">{p.countryCode}</span>
                <span className="tabular-nums">
                  {p.currency} {p.sellPrice.toString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Sub-users" description={`${r.subUsers.length} clients`}>
        {r.subUsers.length === 0 ? (
          <AdminEmpty>No sub-users yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 pr-4">Client</th>
                  <th className="pb-2 pr-4 text-right">Credits</th>
                  <th className="pb-2 pr-4 text-right">SMS</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {r.subUsers.map((su) => (
                  <tr key={su.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{su.user.fullName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{su.user.phone}</p>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {su.user.smsCredit?.balance ?? 0}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {su.user._count.messages}
                    </td>
                    <td className="py-3">
                      {su.isSuspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                          Active
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard title="Recent commission ledger">
        {r.commissions.length === 0 ? (
          <AdminEmpty>No commission entries.</AdminEmpty>
        ) : (
          <ul className="text-xs space-y-2 max-h-64 overflow-y-auto">
            {r.commissions.map((c) => (
              <li key={c.id} className="flex justify-between gap-4 border-b border-border/40 pb-2">
                <span>
                  GHS {c.amount.toString()} · {c.source}
                  {c.paidAt ? (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      Unpaid
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {format(c.createdAt, "MMM d HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
