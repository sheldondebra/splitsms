import {
  approveResellerAction,
  suspendResellerAction,
  createResellerFromUserAction,
} from "@/lib/actions/admin-resellers";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function AdminResellersPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; created?: string }>;
}) {
  const params = await searchParams;

  const [resellers, members] = await Promise.all([
    prisma.reseller.findMany({
      include: {
        user: { include: { wallet: true } },
        _count: { select: { subUsers: true, commissions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "MEMBER" },
      take: 15,
      select: { id: true, fullName: true, phone: true },
    }),
  ]);

  const totalCommissions = await prisma.resellerCommission.aggregate({
    _sum: { amount: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Resellers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approve partners · Total commissions: GHS{" "}
          {totalCommissions._sum.amount?.toNumber().toFixed(2) ?? "0"}
        </p>
      </div>
      {params.approved && <p className="text-sm text-green-600">Reseller approved.</p>}

      <Card>
        <CardHeader>
          <CardTitle>Promote member to reseller</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createResellerFromUserAction} className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>Member</Label>
              <select name="userId" className="flex h-10 rounded-md border px-3 text-sm" required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Business name</Label>
              <Input name="businessName" required />
            </div>
            <Button type="submit">Create reseller</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All resellers ({resellers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resellers.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap justify-between gap-4 border-b py-4 last:border-0"
            >
              <div>
                <p className="font-medium">{r.businessName}</p>
                <p className="text-sm text-muted-foreground">{r.user.fullName} · {r.user.phone}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r._count.subUsers} sub-users · {r._count.commissions} commissions
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    r.status === "APPROVED"
                      ? "outline"
                      : r.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {r.status}
                </Badge>
                {r.status === "PENDING" && (
                  <form action={approveResellerAction} className="flex gap-1">
                    <input type="hidden" name="resellerId" value={r.id} />
                    <Input
                      name="commissionRate"
                      type="number"
                      defaultValue={10}
                      className="h-8 w-16"
                      title="Commission %"
                    />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                )}
                {r.status === "APPROVED" && (
                  <form action={suspendResellerAction}>
                    <input type="hidden" name="resellerId" value={r.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      Suspend
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
