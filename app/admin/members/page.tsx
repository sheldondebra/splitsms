import { prisma } from "@/lib/db";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2 } from "lucide-react";

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    include: { wallet: true, smsCredit: true },
    take: 100,
  });

  const verified = members.filter((m) => m.isVerified).length;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Members"
        description="Registered users, wallet balances, and SMS credits."
        icon={Users}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total members" value={members.length} variant="primary" />
        <AdminStatCard
          label="Verified phones"
          value={verified}
          hint={`${members.length > 0 ? Math.round((verified / members.length) * 100) : 0}% verified`}
        />
        <AdminStatCard
          label="With credits"
          value={members.filter((m) => (m.smsCredit?.balance ?? 0) > 0).length}
        />
      </div>

      <AdminCard title="Member directory" description={`Showing latest ${members.length} members`}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium text-right">Credits</th>
                <th className="pb-3 pr-4 font-medium text-right">Wallet</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    No members yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="py-3.5 pr-4 font-medium">{m.fullName}</td>
                    <td className="py-3.5 pr-4 text-muted-foreground font-mono text-xs">
                      {m.phone}
                    </td>
                    <td className="py-3.5 pr-4 text-right tabular-nums font-semibold">
                      {m.smsCredit?.balance ?? 0}
                    </td>
                    <td className="py-3.5 pr-4 text-right tabular-nums text-muted-foreground">
                      {m.wallet
                        ? `${m.wallet.currency} ${m.wallet.balance.toString()}`
                        : "—"}
                    </td>
                    <td className="py-3.5">
                      {m.isVerified ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
