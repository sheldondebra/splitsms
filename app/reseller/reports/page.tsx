import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerAnalytics } from "@/lib/reseller/analytics";
import { getSubUserIds } from "@/lib/reseller/context";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResellerReportsPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const analytics = await getResellerAnalytics(reseller.id);
  const subUserIds = await getSubUserIds(reseller.id);

  const topClients = subUserIds.length
    ? await prisma.message.groupBy({
        by: ["userId"],
        where: { userId: { in: subUserIds } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      })
    : [];

  const users = topClients.length
    ? await prisma.user.findMany({
        where: { id: { in: topClients.map((t) => t.userId) } },
        select: { id: true, fullName: true, phone: true },
      })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Delivery rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.deliveryRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Client wallets total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {analytics.currency} {analytics.subUsersWalletTotal.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top clients by SMS volume</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {topClients.length === 0 ? (
            <p className="text-muted-foreground">No SMS activity yet.</p>
          ) : (
            topClients.map((t) => (
              <div key={t.userId} className="flex justify-between border-b py-2">
                <span>{userMap[t.userId]?.fullName ?? t.userId}</span>
                <span>{t._count.id} messages</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
