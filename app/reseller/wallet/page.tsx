import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { fundSubUserAction } from "@/lib/actions/reseller";
import { resellerPayoutCommissionsAction } from "@/lib/actions/admin-resellers";
import { getUnpaidCommissionTotal } from "@/lib/reseller/payout";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
  ResellerCard,
} from "@/components/reseller/reseller-page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowDownToLine } from "lucide-react";

export default async function ResellerWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ funded?: string; saved?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [wallet, subUsers, unpaid] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.resellerUser.findMany({
      where: { resellerId: reseller.id, isSuspended: false },
      include: { user: true },
    }),
    getUnpaidCommissionTotal(reseller.id),
  ]);

  const currency = wallet?.currency ?? "GHS";

  return (
    <ResellerPage>
      <ResellerPageHeader
        title="Wallet & payouts"
        description="Top up your balance, fund sub-users, and transfer earned commissions to your wallet."
        icon={Wallet}
      />

      {params.funded && (
        <p className="text-sm text-emerald-600 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
          Sub-user funded successfully.
        </p>
      )}
      {params.saved === "payout" && (
        <p className="text-sm text-emerald-600 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
          Commission paid out to your wallet.
        </p>
      )}
      {params.error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2">
          {decodeURIComponent(params.error)}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <ResellerStatCard
          label="Available balance"
          value={`${currency} ${wallet?.balance.toString() ?? "0"}`}
          accent
        />
        <ResellerStatCard
          label="Unpaid commission"
          value={`${currency} ${unpaid.toFixed(2)}`}
          hint="Earned from sub-user SMS margin"
        />
      </div>

      {unpaid > 0 && (
        <ResellerCard title="Commission payout">
          <p className="text-sm text-muted-foreground mb-4">
            Transfer all unpaid commission entries to your wallet balance for withdrawal or
            re-investment.
          </p>
          <form action={resellerPayoutCommissionsAction}>
            <Button type="submit" className="w-full sm:w-auto">
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Pay out {currency} {unpaid.toFixed(2)}
            </Button>
          </form>
        </ResellerCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ResellerCard title="Fund a sub-user">
          {subUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Link href="/reseller/users" className="text-primary hover:underline">
                Create a sub-user
              </Link>{" "}
              first.
            </p>
          ) : (
            <form action={fundSubUserAction} className="space-y-4">
              <div className="space-y-2">
                <Label>Sub-user</Label>
                <select
                  name="subUserId"
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {subUsers.map((su) => (
                    <option key={su.userId} value={su.userId}>
                      {su.user.fullName} ({su.user.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Transfer type</Label>
                <select name="mode" className="flex h-10 w-full rounded-lg border px-3 text-sm">
                  <option value="wallet">Wallet balance ({currency})</option>
                  <option value="credits">SMS credits</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Wallet amount</Label>
                <Input name="amount" type="number" step="0.01" placeholder="50.00" />
              </div>
              <div className="space-y-2">
                <Label>SMS credits (if credits mode)</Label>
                <Input name="credits" type="number" placeholder="500" />
              </div>
              <Input type="hidden" name="countryCode" value="GH" />
              <Button type="submit" className="w-full">
                Transfer funds
              </Button>
            </form>
          )}
        </ResellerCard>

        <ResellerCard title="Top up your wallet">
          <p className="text-sm text-muted-foreground mb-4">
            Use the standard member wallet flow (Paystack, manual, etc.) to add funds to your
            reseller account.
          </p>
          <Link
            href="/dashboard/wallet"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Open wallet top-up →
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Funds debited when you allocate credits or wallet balance to sub-users.
          </p>
        </ResellerCard>
      </div>
    </ResellerPage>
  );
}
