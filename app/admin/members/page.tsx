import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, ArrowRight } from "lucide-react";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      wallet: true,
      smsCredit: true,
      memberAccount: true,
      _count: { select: { apiKeys: true, senderIds: true } },
    },
    take: 100,
  });

  const verified = members.filter((m) => m.isVerified).length;
  const suspended = members.filter(
    (m) => m.memberAccount?.status === "SUSPENDED" || m.memberAccount?.status === "BLOCKED",
  ).length;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Members"
        description="Open a member to manage credits, API keys, sender IDs, sessions, provider assignment, and access."
        icon={Users}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Listed" value={members.length} variant="primary" />
        <AdminStatCard
          label="Verified"
          value={verified}
          hint={`${members.length > 0 ? Math.round((verified / members.length) * 100) : 0}%`}
        />
        <AdminStatCard
          label="Suspended / blocked"
          value={suspended}
          variant={suspended > 0 ? "warning" : "default"}
        />
      </div>

      <AdminCard
        title="Member directory"
        description="Click a row for full account management"
        actions={
          <form className="flex gap-2" action="/admin/members" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search name, phone, email…"
              className="h-8 w-48 rounded-md border border-input bg-background px-2 text-xs"
            />
          </form>
        }
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium text-right">Credits</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const acc = m.memberAccount;
                  const isHeld =
                    acc?.status === "SUSPENDED" || acc?.status === "BLOCKED";
                  return (
                    <tr key={m.id} className="hover:bg-muted/20 group">
                      <td className="py-3.5 pr-4">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {m.fullName}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {m._count.apiKeys} API · {m._count.senderIds} sender
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground font-mono text-xs">
                        {m.phone}
                      </td>
                      <td className="py-3.5 pr-4 text-right tabular-nums font-semibold">
                        {m.smsCredit?.balance ?? 0}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {isHeld ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {acc?.status}
                            </Badge>
                          ) : m.isVerified ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px]"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                          aria-label={`Manage ${m.fullName}`}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
