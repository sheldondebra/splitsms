import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function approveSenderId(formData: FormData) {
  "use server";
  const { prisma } = await import("@/lib/db");
  await prisma.senderId.update({
    where: { id: String(formData.get("id")) },
    data: { status: "APPROVED" },
  });
}

export default async function AdminSenderIdsPage() {
  const requests = await prisma.senderId.findMany({
    where: { status: "PENDING" },
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sender ID requests</h1>
      <Card>
        <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {requests.map((s) => (
            <div key={s.id} className="flex justify-between items-center border-b py-3">
              <div>
                <p className="font-medium">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.user.fullName}</p>
              </div>
              <form action={approveSenderId}>
                <input type="hidden" name="id" value={s.id} />
                <Button size="sm" type="submit">Approve</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
