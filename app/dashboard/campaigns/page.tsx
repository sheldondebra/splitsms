import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  pauseCampaignAction,
  resumeCampaignAction,
  cancelCampaignAction,
} from "@/lib/actions/campaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { q, status } = await searchParams;

  const campaigns = await prisma.campaign.findMany({
    where: {
      userId: session.userId,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status: status as "SCHEDULED" | "PAUSED" | "COMPLETED" | "SENDING" | "CANCELLED" | "DRAFT" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { select: { status: true } },
      contactGroup: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule, personalize, and track delivery
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/templates" className="text-sm text-muted-foreground hover:text-primary">
            Templates
          </Link>
          <Link href="/dashboard/campaigns/new" className="text-sm text-primary font-medium">
            + New campaign
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2 max-w-2xl">
        <Input name="q" placeholder="Search campaigns…" defaultValue={q} className="max-w-xs" />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PAUSED">Paused</option>
          <option value="SENDING">Sending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>All campaigns ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No campaigns yet.</p>
          ) : (
            campaigns.map((c) => {
              const total = c.messages.length;
              const delivered = c.messages.filter((m) => m.status === "DELIVERED").length;
              const failed = c.messages.filter((m) => m.status === "FAILED").length;
              const pct = total > 0 ? Math.round((delivered / total) * 100) : 0;

              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b py-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.recipientCount || total} recipients
                      {c.contactGroup ? ` · ${c.contactGroup.name}` : ""}
                      {c.recurrence !== "NONE" ? ` · ${c.recurrence}` : ""}
                      {c.scheduledAt
                        ? ` · ${new Date(c.scheduledAt).toLocaleString()}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {delivered} delivered · {failed} failed · {pct}% rate
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{c.status}</Badge>
                    {c.status === "SCHEDULED" && (
                      <form action={pauseCampaignAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Pause
                        </Button>
                      </form>
                    )}
                    {c.status === "PAUSED" && (
                      <form action={resumeCampaignAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Resume
                        </Button>
                      </form>
                    )}
                    {["SCHEDULED", "PAUSED"].includes(c.status) && (
                      <form action={cancelCampaignAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                          Cancel
                        </Button>
                      </form>
                    )}
                    <Link
                      href={`/dashboard/reports?campaign=${c.id}`}
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      Logs
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
