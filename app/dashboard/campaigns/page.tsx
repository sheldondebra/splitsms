import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  pauseCampaignAction,
  resumeCampaignAction,
  cancelCampaignAction,
} from "@/lib/actions/campaigns";
import {
  AppPage,
  PageHeader,
  AppCard,
  MobileCardList,
  MobileCardItem,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Plus } from "lucide-react";

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
      ...(status
        ? {
            status: status as
              | "SCHEDULED"
              | "PAUSED"
              | "COMPLETED"
              | "SENDING"
              | "CANCELLED"
              | "DRAFT",
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { select: { status: true } },
      contactGroup: { select: { name: true } },
    },
  });

  return (
    <AppPage>
      <PageHeader
        title="Campaigns"
        description="Schedule, personalize, and track delivery"
        icon={Megaphone}
        mobileDescription="Schedule and track bulk SMS campaigns."
        actions={
          <>
            <Link
              href="/dashboard/templates"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium md:h-10"
            >
              Templates
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground md:h-10"
            >
              <Plus className="h-4 w-4" />
              New campaign
            </Link>
          </>
        }
      />

      <form method="get" className="grid gap-2 sm:flex sm:flex-wrap sm:gap-2">
        <Input
          name="q"
          placeholder="Search campaigns…"
          defaultValue={q}
          className="w-full sm:max-w-xs"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-11 sm:h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-base sm:text-sm"
        >
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PAUSED">Paused</option>
          <option value="SENDING">Sending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Button type="submit" variant="secondary" className="w-full sm:w-auto min-h-11">
          Filter
        </Button>
      </form>

      {campaigns.length === 0 ? (
        <AppCard>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No campaigns yet.{" "}
            <Link href="/dashboard/campaigns/new" className="text-primary font-medium">
              Create one →
            </Link>
          </CardContent>
        </AppCard>
      ) : (
        <>
          <MobileCardList>
            {campaigns.map((c) => {
              const total = c.messages.length;
              const delivered = c.messages.filter((m) => m.status === "DELIVERED").length;
              const failed = c.messages.filter((m) => m.status === "FAILED").length;
              const pct = total > 0 ? Math.round((delivered / total) * 100) : 0;

              return (
                <MobileCardItem key={c.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold truncate">{c.name}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.recipientCount || total} recipients
                    {c.contactGroup ? ` · ${c.contactGroup.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {delivered} delivered · {failed} failed · {pct}%
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      href={`/dashboard/reports?campaign=${c.id}`}
                      className="text-sm font-medium text-primary"
                    >
                      View logs
                    </Link>
                    {c.status === "SCHEDULED" && (
                      <form action={pauseCampaignAction} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Pause
                        </Button>
                      </form>
                    )}
                    {c.status === "PAUSED" && (
                      <form action={resumeCampaignAction} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Resume
                        </Button>
                      </form>
                    )}
                  </div>
                </MobileCardItem>
              );
            })}
          </MobileCardList>

          <AppCard className="hidden md:block">
            <CardHeader>
              <CardTitle>All campaigns ({campaigns.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaigns.map((c) => {
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
              })}
            </CardContent>
          </AppCard>
        </>
      )}
    </AppPage>
  );
}
