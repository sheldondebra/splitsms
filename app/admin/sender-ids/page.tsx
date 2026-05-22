import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function approveSenderId(formData: FormData) {
  "use server";
  const { prisma } = await import("@/lib/db");
  const { revalidatePath } = await import("next/cache");
  const id = String(formData.get("id"));
  const isDefault = formData.get("setDefault") === "1";
  const userId = (
    await prisma.senderId.findUnique({ where: { id }, select: { userId: true } })
  )?.userId;

  if (userId && isDefault) {
    await prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "APPROVED",
      ...(isDefault ? { isDefault: true } : {}),
    },
  });
  revalidatePath("/admin/sender-ids");
}

async function rejectSenderId(formData: FormData) {
  "use server";
  const { prisma } = await import("@/lib/db");
  const { revalidatePath } = await import("next/cache");
  await prisma.senderId.update({
    where: { id: String(formData.get("id")) },
    data: {
      status: "REJECTED",
      adminNote: String(formData.get("note") ?? "Does not meet naming requirements").trim(),
      isDefault: false,
    },
  });
  revalidatePath("/admin/sender-ids");
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
              <div className="flex flex-wrap gap-2">
                <form action={approveSenderId}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="setDefault" value="1" />
                  <Button size="sm" type="submit">Approve</Button>
                </form>
                <form action={rejectSenderId} className="flex gap-1 items-center">
                  <input type="hidden" name="id" value={s.id} />
                  <input
                    type="text"
                    name="note"
                    placeholder="Deny reason"
                    className="h-8 w-32 rounded-md border px-2 text-xs"
                  />
                  <Button size="sm" type="submit" variant="destructive">
                    Deny
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
