import { format } from "date-fns";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import {
  adminCreateResellerPromoAction,
  adminToggleResellerPromoAction,
} from "@/lib/actions/admin-resellers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

type PromoRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  redemptionCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

const TYPE_LABELS: Record<string, string> = {
  FIXED_CREDIT: "SMS credits",
  WALLET_BONUS: "Wallet bonus",
  PERCENT_BONUS: "% SMS bonus",
};

function formatPromoValue(type: string, value: number) {
  if (type === "PERCENT_BONUS") return `${value}%`;
  if (type === "WALLET_BONUS") return `GHS ${value.toFixed(2)}`;
  return `${Math.floor(value)} credits`;
}

export function ResellerPromosPanel({
  resellerId,
  promos,
}: {
  resellerId: string;
  promos: PromoRow[];
}) {
  return (
    <AdminCard
      title="Partner promos"
      description="Promo codes only redeemable by this partner's clients"
    >
      <form action={adminCreateResellerPromoAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <input type="hidden" name="resellerId" value={resellerId} />
        <div className="space-y-2">
          <Label htmlFor="promo-code">Code</Label>
          <Input id="promo-code" name="code" placeholder="PARTNER50" required className="uppercase" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo-type">Type</Label>
          <select
            id="promo-type"
            name="type"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="FIXED_CREDIT">Fixed SMS credits</option>
            <option value="WALLET_BONUS">Wallet bonus (GHS)</option>
            <option value="PERCENT_BONUS">Percent SMS bonus</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo-value">Value</Label>
          <Input id="promo-value" name="value" type="number" min={0.01} step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo-max">Max uses (0 = unlimited)</Label>
          <Input id="promo-max" name="maxUses" type="number" min={0} defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo-expires">Expires (optional)</Label>
          <Input id="promo-expires" name="expiresAt" type="datetime-local" />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            <Tag className="h-4 w-4 mr-2" />
            Create promo
          </Button>
        </div>
      </form>

      {promos.length === 0 ? (
        <AdminEmpty>No promos for this partner yet.</AdminEmpty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="pb-2 pr-3">Code</th>
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3 text-right">Value</th>
                <th className="pb-2 pr-3 text-right">Uses</th>
                <th className="pb-2 pr-3">Expires</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="py-2.5 pr-3 font-mono font-semibold">{p.code}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {TYPE_LABELS[p.type] ?? p.type}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">
                    {formatPromoValue(p.type, p.value)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                    {p.redemptionCount}
                    {p.maxUses != null ? ` / ${p.maxUses}` : ""}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                    {p.expiresAt ? format(p.expiresAt, "MMM d, yyyy") : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    {p.isActive ? (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                  </td>
                  <td className="py-2.5">
                    <form action={adminToggleResellerPromoAction}>
                      <input type="hidden" name="resellerId" value={resellerId} />
                      <input type="hidden" name="promoId" value={p.id} />
                      <input type="hidden" name="isActive" value={p.isActive ? "0" : "1"} />
                      <Button type="submit" size="sm" variant="ghost" className="h-8 text-xs">
                        {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}
