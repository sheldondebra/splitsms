import Link from "next/link";
import { format } from "date-fns";
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
  deleteResellerAction,
  adminResellerBonusCreditsAction,
  adminResellerBonusWalletAction,
} from "@/lib/actions/admin-resellers";
import {
  getResellerClientLoginHref,
  getResellerOwnerAdminHref,
} from "@/lib/admin/reseller-portal-url";
import { startResellerImpersonationAction } from "@/lib/actions/admin-impersonation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TenantDnsGuide } from "@/components/tenant/tenant-dns-guide";
import { ResellerPromosPanel } from "@/components/admin/resellers/reseller-promos-panel";
import { ResellerClientsPanel } from "@/components/admin/resellers/reseller-clients-panel";
import {
  ArrowLeft,
  Users,
  Wallet,
  Percent,
  Globe,
  CheckCircle2,
  Trash2,
  Ban,
  Tags,
  ExternalLink,
  UserRound,
  Coins,
  Gift,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

function detailFlash(saved?: string) {
  const map: Record<string, string> = {
    payout: "Unpaid commissions transferred to reseller wallet.",
    updated: "Settings saved.",
    approved: "Reseller approved and portal access enabled.",
    rejected: "Application rejected.",
    suspended: "Reseller suspended. Portal access is blocked.",
    reactivated: "Reseller reactivated.",
    bonus_wallet: "Wallet bonus applied to reseller owner account.",
    bonus_credits: "SMS credit bonus applied to reseller owner account.",
    promo_created: "Partner promo code created.",
    promo_updated: "Promo status updated.",
    client_moved: "Client account moved successfully.",
    client_assigned: "Member assigned to this partner.",
  };
  return map[saved ?? ""] ?? "Action completed.";
}

export default async function AdminResellerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const {
    reseller,
    unpaidCommissions,
    paidCommissions,
    smsLast30Days,
    pricingComparison,
    platformPricing,
    promos,
    otherResellers,
    assignCandidates,
  } = await getAdminResellerDetail(id);
  const r = reseller;
  const wallet = r.user.wallet;
  const ownerCredits = r.user.smsCredit?.balance ?? 0;
  const clientsWallet = r.subUsers.reduce(
    (sum, su) => sum + (su.user.wallet?.balance.toNumber() ?? 0),
    0,
  );
  const clientsCredits = r.subUsers.reduce(
    (sum, su) => sum + (su.user.smsCredit?.balance ?? 0),
    0,
  );
  const loginHref = getResellerClientLoginHref(r.domain);
  const ownerHref = getResellerOwnerAdminHref(r.userId);

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
          {detailFlash(q.saved)}
        </AdminAlert>
      )}
      {q.error === "payout" && (
        <AdminAlert variant="warning">No unpaid commissions to payout.</AdminAlert>
      )}
      {q.error === "bonus" && (
        <AdminAlert variant="warning">Enter a non-zero bonus amount.</AdminAlert>
      )}
      {q.error === "credits_negative" && (
        <AdminAlert variant="warning">SMS credits cannot go below zero.</AdminAlert>
      )}
      {q.error === "wallet_negative" && (
        <AdminAlert variant="warning">Wallet balance cannot go below zero.</AdminAlert>
      )}
      {q.error === "delete_confirm" && (
        <AdminAlert variant="warning">
          Type <strong>DELETE</strong> exactly in the danger zone to confirm permanent removal.
        </AdminAlert>
      )}
      {q.error === "promo" && (
        <AdminAlert variant="warning">Check promo code, value, and expiry date.</AdminAlert>
      )}
      {q.error === "promo_exists" && (
        <AdminAlert variant="warning">That promo code already exists.</AdminAlert>
      )}
      {q.error === "move" && (
        <AdminAlert variant="warning">Provide a reason to move this client.</AdminAlert>
      )}
      {q.error === "move_not_found" && (
        <AdminAlert variant="warning">Client not found under this partner.</AdminAlert>
      )}
      {q.error === "move_target" && (
        <AdminAlert variant="warning">Select a valid target partner for the move.</AdminAlert>
      )}
      {q.error === "move_partner_owner" && (
        <AdminAlert variant="warning">Cannot move a partner owner account as a client.</AdminAlert>
      )}
      {q.error === "move_self" && (
        <AdminAlert variant="warning">Cannot move a client to the same partner owner account.</AdminAlert>
      )}
      {q.error === "assign" && (
        <AdminAlert variant="warning">Select a member to assign.</AdminAlert>
      )}
      {q.error === "assign_ineligible" && (
        <AdminAlert variant="warning">
          Member must be a direct platform account with no existing reseller link.
        </AdminAlert>
      )}
      {q.error === "assign_self" && (
        <AdminAlert variant="warning">Cannot assign the partner owner as their own client.</AdminAlert>
      )}
      {q.error === "impersonate" && (
        <AdminAlert variant="warning">
          Only approved, active partners can be opened in the portal as that account.
        </AdminAlert>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{r.businessName}</h1>
              <StatusPill status={r.status} />
              {!r.isActive && (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
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
                  <input type="hidden" name="returnTo" value="detail" />
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
                  <input type="hidden" name="returnTo" value="detail" />
                  <Button type="submit" size="sm" variant="destructive">
                    Reject
                  </Button>
                </form>
              </>
            )}
            {r.status === "APPROVED" && (
              <form action={suspendResellerAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <input type="hidden" name="returnTo" value="detail" />
                <Button type="submit" size="sm" variant="outline" className="text-destructive">
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Suspend account
                </Button>
              </form>
            )}
            {(r.status === "SUSPENDED" || r.status === "REJECTED") && (
              <form action={reactivateResellerAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <input type="hidden" name="returnTo" value="detail" />
                <Button type="submit" size="sm">
                  Reactivate
                </Button>
              </form>
            )}
            <Link
              href={ownerHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <UserRound className="h-3.5 w-3.5 mr-1" />
              Owner account
            </Link>
            {r.status === "APPROVED" && r.isActive && (
              <form action={startResellerImpersonationAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <Button type="submit" size="sm">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Open as partner
                </Button>
              </form>
            )}
            {loginHref && (
              <Link
                href={loginHref}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Client login URL
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard
          label="Owner wallet"
          value={wallet ? `GHS ${Number(wallet.balance).toFixed(2)}` : "—"}
          icon={Wallet}
        />
        <AdminStatCard
          label="Client wallets"
          value={`GHS ${clientsWallet.toFixed(2)}`}
          icon={Users}
        />
        <AdminStatCard
          label="Owner credits"
          value={ownerCredits.toLocaleString()}
          icon={Coins}
        />
        <AdminStatCard
          label="Client credits"
          value={clientsCredits.toLocaleString()}
          icon={Coins}
        />
        <AdminStatCard
          label="Unpaid commission"
          value={`GHS ${unpaidCommissions.toFixed(2)}`}
          icon={Wallet}
          variant={unpaidCommissions > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="SMS (30d)"
          value={smsLast30Days.toLocaleString()}
          hint={`${r._count.subUsers} clients · ${r.commissionRate.toNumber()}%`}
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

        <div className="space-y-6">
          <AdminCard
            title="Bonus credit"
            description="Grant wallet funds or SMS credits to this partner’s owner account"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <form action={adminResellerBonusWalletAction} className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
                <input type="hidden" name="resellerId" value={r.id} />
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Gift className="h-4 w-4 text-primary" />
                  Wallet bonus
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-amount">Amount (GHS)</Label>
                  <Input
                    id="wallet-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50 or -10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-note">Reason</Label>
                  <Input id="wallet-note" name="note" placeholder="Promo, goodwill, correction…" />
                </div>
                <Button type="submit" size="sm" className="w-full">
                  Apply wallet bonus
                </Button>
              </form>

              <form action={adminResellerBonusCreditsAction} className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
                <input type="hidden" name="resellerId" value={r.id} />
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Coins className="h-4 w-4 text-primary" />
                  SMS credit bonus
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits-amount">Credits</Label>
                  <Input
                    id="credits-amount"
                    name="amount"
                    type="number"
                    step="1"
                    placeholder="e.g. 500 or -100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits-note">Reason</Label>
                  <Input id="credits-note" name="note" placeholder="Launch bonus, promo pack…" />
                </div>
                <Button type="submit" size="sm" className="w-full">
                  Apply SMS bonus
                </Button>
              </form>
            </div>
          </AdminCard>

          <AdminCard title="Wallet & commissions">
            <p className="text-sm text-muted-foreground mb-1">
              Owner wallet:{" "}
              <strong className="text-foreground tabular-nums">
                {wallet ? `${wallet.currency} ${wallet.balance.toString()}` : "—"}
              </strong>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Paid out (all time):{" "}
              <strong className="text-foreground tabular-nums">GHS {paidCommissions.toFixed(2)}</strong>
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
      </div>

      <AdminCard
        title="Reseller pricing"
        description={
          pricingComparison.length > 0
            ? `${pricingComparison.length} sell-price overrides vs platform wholesale`
            : "Partner uses platform defaults until they set custom rates"
        }
      >
        {pricingComparison.length === 0 ? (
          <div className="space-y-4">
            <AdminEmpty>
              No custom country pricing. Showing platform wholesale rates they would pay.
            </AdminEmpty>
            {platformPricing.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="pb-2 pr-3">Country</th>
                      <th className="pb-2 pr-3 text-right">Wholesale</th>
                      <th className="pb-2 pr-3 text-right">Member</th>
                      <th className="pb-2 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {platformPricing.map((p) => (
                      <tr key={p.countryCode}>
                        <td className="py-2.5 pr-3">
                          <span className="font-medium">{p.countryName}</span>
                          <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                            {p.countryCode}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">
                          {p.currency} {p.resellerPrice.toFixed(3)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                          {p.currency} {p.memberPrice.toFixed(3)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {p.currency} {p.costPrice.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 pr-3">Country</th>
                  <th className="pb-2 pr-3 text-right">Sell price</th>
                  <th className="pb-2 pr-3 text-right">Wholesale</th>
                  <th className="pb-2 pr-3 text-right">Markup</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pricingComparison.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3">
                      <span className="font-mono font-semibold">{p.countryCode}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">
                      {p.currency} {p.sellPrice.toFixed(3)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                      {p.wholesale != null
                        ? `${p.currency} ${p.wholesale.toFixed(3)}`
                        : "—"}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pr-3 text-right tabular-nums text-xs font-medium",
                        p.margin == null
                          ? "text-muted-foreground"
                          : p.margin >= 0
                            ? "text-emerald-600"
                            : "text-destructive",
                      )}
                    >
                      {p.margin == null
                        ? "—"
                        : `${p.margin >= 0 ? "+" : ""}${p.currency} ${p.margin.toFixed(3)}`}
                    </td>
                    <td className="py-2.5">
                      {p.isActive ? (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Off</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <Tags className="h-3 w-3" />
          Sell prices are set by the partner in the reseller portal; wholesale is your platform rate.
        </p>
      </AdminCard>

      <ResellerPromosPanel resellerId={r.id} promos={promos} />

      <ResellerClientsPanel
        resellerId={r.id}
        subUsers={r.subUsers}
        otherResellers={otherResellers}
        assignCandidates={assignCandidates}
      />

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

      <AdminCard
        title="Danger zone"
        description="Suspend temporarily, or permanently delete this reseller account"
      >
        <div className="space-y-5">
          {r.status === "APPROVED" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-sm font-medium mb-1">Suspend partner</p>
              <p className="text-xs text-muted-foreground mb-3">
                Blocks portal access and commission earning. Sub-users stop sending under this partner.
                The owner account remains as a member. You can reactivate later.
              </p>
              <form action={suspendResellerAction}>
                <input type="hidden" name="resellerId" value={r.id} />
                <input type="hidden" name="returnTo" value="detail" />
                <Button type="submit" size="sm" variant="outline" className="text-amber-700 border-amber-500/40">
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Suspend reseller
                </Button>
              </form>
            </div>
          )}

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete reseller account
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Permanently removes this partner, their pricing overrides, sub-user links, and commission
              ledger. The owner user is demoted to MEMBER and kept. Type <strong>DELETE</strong> to confirm.
            </p>
            <form action={deleteResellerAction} className="flex flex-col sm:flex-row gap-2 sm:items-end max-w-md">
              <input type="hidden" name="resellerId" value={r.id} />
              <div className="space-y-2 flex-1">
                <Label htmlFor="delete-confirm">Confirmation</Label>
                <Input
                  id="delete-confirm"
                  name="confirmation"
                  placeholder="Type DELETE"
                  autoComplete="off"
                  required
                />
              </div>
              <Button type="submit" variant="destructive" size="sm">
                Delete forever
              </Button>
            </form>
          </div>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
