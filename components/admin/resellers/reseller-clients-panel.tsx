import Link from "next/link";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import {
  adminAssignMemberToResellerAction,
  adminMoveResellerClientAction,
} from "@/lib/actions/admin-resellers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ArrowRightLeft } from "lucide-react";

type SubUser = {
  id: string;
  userId: string;
  isSuspended: boolean;
  user: {
    fullName: string;
    phone: string;
    wallet: { currency: string; balance: { toNumber?: () => number } | number | string } | null;
    smsCredit: { balance: number } | null;
    _count: { messages: number };
  };
};

type OtherReseller = { id: string; businessName: string };
type AssignCandidate = { id: string; fullName: string; phone: string };

function walletAmount(wallet: SubUser["user"]["wallet"]): string {
  if (!wallet) return "—";
  const balance =
    typeof wallet.balance === "object" && wallet.balance && "toNumber" in wallet.balance
      ? (wallet.balance as { toNumber: () => number }).toNumber()
      : Number(wallet.balance);
  return `${wallet.currency} ${balance.toFixed(2)}`;
}

export function ResellerClientsPanel({
  resellerId,
  subUsers,
  otherResellers,
  assignCandidates,
}: {
  resellerId: string;
  subUsers: SubUser[];
  otherResellers: OtherReseller[];
  assignCandidates: AssignCandidate[];
}) {
  return (
    <AdminCard
      title="Clients"
      description={`${subUsers.length} linked accounts · Assign existing members or move clients between partners`}
    >
      <div className="mb-6 rounded-xl border border-border/50 bg-muted/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-3">
          <UserPlus className="h-4 w-4 text-primary" />
          Assign existing member
        </div>
        {assignCandidates.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No eligible direct members without a reseller link.
          </p>
        ) : (
          <form
            action={adminAssignMemberToResellerAction}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input type="hidden" name="resellerId" value={resellerId} />
            <div className="space-y-2 sm:col-span-2">
              <Label>Member</Label>
              <select
                name="userId"
                required
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select member…</option>
                {assignCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} · {m.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input name="reason" placeholder="Migration, sales handoff…" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Assign to partner
              </Button>
            </div>
          </form>
        )}
      </div>

      {subUsers.length === 0 ? (
        <AdminEmpty>No clients yet. Assign an existing member or ask the partner to create one.</AdminEmpty>
      ) : (
        <div className="space-y-4">
          {subUsers.map((su) => (
            <div key={su.id} className="rounded-xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <tbody>
                    <tr className="hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/members/${su.userId}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {su.user.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">{su.user.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                        {walletAmount(su.user.wallet)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        {su.user.smsCredit?.balance ?? 0} cr
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        {su.user._count.messages} SMS
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {su.isSuspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                            Active
                          </Badge>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <details className="border-t border-border/40 bg-muted/5 group">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Move client to another account
                </summary>
                <form
                  action={adminMoveResellerClientAction}
                  className="px-4 pb-4 pt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/30"
                >
                  <input type="hidden" name="fromResellerId" value={resellerId} />
                  <input type="hidden" name="clientUserId" value={su.userId} />

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Destination</Label>
                    <select
                      name="destination"
                      required
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      defaultValue="platform"
                    >
                      <option value="platform">Direct platform (remove from reseller)</option>
                      <option value="reseller" disabled={otherResellers.length === 0}>
                        Another reseller partner
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Target partner (if moving to reseller)</Label>
                    <select
                      name="targetResellerId"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      defaultValue=""
                    >
                      <option value="">Select partner…</option>
                      {otherResellers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.businessName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                    <Label>Reason (required)</Label>
                    <Input name="reason" required placeholder="Why is this client being moved?" />
                  </div>

                  <div className="flex items-end">
                    <Button type="submit" size="sm" variant="outline" className="w-full">
                      Confirm move
                    </Button>
                  </div>
                </form>
              </details>
            </div>
          ))}
        </div>
      )}
    </AdminCard>
  );
}
