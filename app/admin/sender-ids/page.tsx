import { prisma } from "@/lib/db";
import {
  approveSenderIdAction,
  rejectSenderIdAction,
} from "@/lib/actions/admin-sender-ids";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BadgeCheck } from "lucide-react";

export default async function AdminSenderIdsPage() {
  const requests = await prisma.senderId.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Sender IDs"
        description="Review and approve member sender ID requests before they can send SMS."
        icon={BadgeCheck}
      />

      <AdminCard
        title="Pending requests"
        description={
          requests.length === 0
            ? "No requests awaiting review"
            : `${requests.length} request${requests.length !== 1 ? "s" : ""}`
        }
      >
        {requests.length === 0 ? (
          <AdminEmpty>All sender ID requests are processed.</AdminEmpty>
        ) : (
          <div className="-my-1">
            {requests.map((s) => (
              <AdminListRow key={s.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold font-mono text-sm">{s.value}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {s.countryCode}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{s.user.phone}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <form action={approveSenderIdAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="setDefault" value="1" />
                    <Button size="sm" type="submit">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectSenderIdAction} className="flex gap-2 items-center">
                    <input type="hidden" name="id" value={s.id} />
                    <Input
                      name="note"
                      placeholder="Deny reason"
                      className="h-8 w-36 text-xs"
                    />
                    <Button size="sm" type="submit" variant="destructive">
                      Deny
                    </Button>
                  </form>
                </div>
              </AdminListRow>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
