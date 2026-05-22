import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { createSubUserAction, toggleSubUserSuspendAction } from "@/lib/actions/reseller";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function ResellerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const subUsers = await prisma.resellerUser.findMany({
    where: { resellerId: reseller.id },
    include: {
      user: { include: { wallet: true, smsCredit: true, _count: { select: { messages: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Sub-users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage client accounts under your reseller tenant
        </p>
      </div>

      {params.created && (
        <p className="text-sm text-green-600">Sub-user created successfully.</p>
      )}
      {params.error === "exists" && (
        <p className="text-sm text-destructive">Phone number already registered.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create sub-user</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSubUserAction} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input name="fullName" required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" placeholder="+233..." required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <div>
              <Label>Country</Label>
              <Input name="countryCode" defaultValue="GH" />
            </div>
            <div>
              <Label>Password</Label>
              <Input name="password" type="password" minLength={8} required />
            </div>
            <div>
              <Label>Daily SMS limit (optional)</Label>
              <Input name="dailySmsLimit" type="number" placeholder="Unlimited" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create sub-user</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clients ({subUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subUsers.map((su) => (
            <div
              key={su.id}
              className="flex flex-wrap justify-between gap-4 border-b py-4 last:border-0"
            >
              <div>
                <p className="font-medium">{su.user.fullName}</p>
                <p className="text-sm text-muted-foreground">{su.user.phone}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {su.user.smsCredit?.balance ?? 0} credits · {su.user._count.messages} messages
                </p>
              </div>
              <div className="flex items-center gap-2">
                {su.isSuspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
                <form action={toggleSubUserSuspendAction}>
                  <input type="hidden" name="subUserId" value={su.userId} />
                  <Button type="submit" size="sm" variant="outline">
                    {su.isSuspended ? "Activate" : "Suspend"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
