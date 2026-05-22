import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { wallet: true, smsCredit: true },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Members</h1>
      <Card>
        <CardContent className="divide-y pt-6">
          {members.map((m) => (
            <div key={m.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{m.fullName}</p>
                <p className="text-muted-foreground">{m.phone}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{m.role}</Badge>
                <p className="mt-1">{m.smsCredit?.balance ?? 0} SMS credits</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
