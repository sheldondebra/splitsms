import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { fundSubUserAction } from "@/lib/actions/reseller";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function ResellerWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ funded?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [wallet, subUsers] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.resellerUser.findMany({
      where: { resellerId: reseller.id, isSuspended: false },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Reseller wallet</h1>
      {params.funded && <p className="text-sm text-green-600">Sub-user funded.</p>}
      {params.error && <p className="text-sm text-destructive">{decodeURIComponent(params.error)}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Your balance</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {wallet?.currency} {wallet?.balance.toString() ?? "0"}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fund sub-user</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={fundSubUserAction} className="space-y-4">
            <div>
              <Label>Sub-user</Label>
              <select
                name="subUserId"
                required
                className="flex h-10 w-full rounded-md border px-3 text-sm"
              >
                {subUsers.map((su) => (
                  <option key={su.userId} value={su.userId}>
                    {su.user.fullName} ({su.user.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Mode</Label>
              <select name="mode" className="flex h-10 w-full rounded-md border px-3 text-sm">
                <option value="wallet">Wallet balance (GHS)</option>
                <option value="credits">SMS credits</option>
              </select>
            </div>
            <div>
              <Label>Amount (wallet) or credits count</Label>
              <Input name="amount" type="number" step="0.01" placeholder="50" />
              <Input name="credits" type="number" className="mt-2" placeholder="100 credits" />
            </div>
            <Input type="hidden" name="countryCode" value="GH" />
            <Button type="submit">Transfer funds</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            <Link href="/dashboard/wallet" className="text-primary hover:underline">
              Top up your reseller wallet →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
