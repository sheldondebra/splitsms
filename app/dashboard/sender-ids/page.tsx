import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

async function requestSenderId(formData: FormData) {
  "use server";
  const { getSession } = await import("@/lib/auth/session");
  const { prisma } = await import("@/lib/db");
  const session = await getSession();
  if (!session) return;
  await prisma.senderId.create({
    data: {
      userId: session.userId,
      value: String(formData.get("value")),
      countryCode: String(formData.get("countryCode")),
    },
  });
}

export default async function SenderIdsPage() {
  const session = await getSession();
  if (!session) return null;

  const senderIds = await prisma.senderId.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Sender IDs</h1>
      <Card>
        <CardHeader><CardTitle>Request sender ID</CardTitle></CardHeader>
        <CardContent>
          <form action={requestSenderId} className="space-y-4">
            <div>
              <Label>Sender ID</Label>
              <Input name="value" maxLength={11} required />
            </div>
            <div>
              <Label>Country</Label>
              <Input name="countryCode" defaultValue="GH" required />
            </div>
            <Button type="submit">Submit request</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Your sender IDs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {senderIds.map((s) => (
            <div key={s.id} className="flex justify-between py-2 border-b">
              <span>{s.value}</span>
              <Badge>{s.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
