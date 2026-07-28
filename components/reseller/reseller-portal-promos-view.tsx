import { format } from "date-fns";
import {
  createResellerClientPromoAction,
  toggleResellerClientPromoAction,
} from "@/lib/actions/reseller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tag, CheckCircle2, AlertTriangle } from "lucide-react";

export type ResellerPromoRow = {
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

export function ResellerPortalPromosView({
  promos,
  flash,
}: {
  promos: ResellerPromoRow[];
  flash?: { saved?: string; error?: string };
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create bonus codes your clients can redeem on their wallet page. Codes only work for
          members under your account.
        </p>
      </div>

      {flash?.saved === "created" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Promo code created.
        </div>
      )}
      {flash?.saved === "updated" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Promo status updated.
        </div>
      )}
      {flash?.error === "invalid" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Check code, value, and expiry date.
        </div>
      )}
      {flash?.error === "exists" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          That promo code already exists. Choose a different code.
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          Create promo for your clients
        </h2>
        <form
          action={createResellerClientPromoAction}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="space-y-2">
            <Label htmlFor="r-promo-code">Code</Label>
            <Input id="r-promo-code" name="code" placeholder="WELCOME50" required className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-promo-type">Type</Label>
            <select
              id="r-promo-type"
              name="type"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="FIXED_CREDIT">Fixed SMS credits</option>
              <option value="WALLET_BONUS">Wallet bonus (GHS)</option>
              <option value="PERCENT_BONUS">Percent SMS bonus</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-promo-value">Value</Label>
            <Input id="r-promo-value" name="value" type="number" min={0.01} step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-promo-max">Max uses (0 = unlimited)</Label>
            <Input id="r-promo-max" name="maxUses" type="number" min={0} defaultValue={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-promo-expires">Expires (optional)</Label>
            <Input id="r-promo-expires" name="expiresAt" type="datetime-local" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Create promo
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
          <h2 className="text-sm font-semibold">Your promo codes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {promos.length} code{promos.length !== 1 ? "s" : ""} · Clients redeem on Wallet
          </p>
        </div>
        {promos.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No promos yet. Create one above to reward your clients.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="py-3 pr-3 font-medium">Type</th>
                  <th className="py-3 pr-3 font-medium text-right">Value</th>
                  <th className="py-3 pr-3 font-medium text-right">Uses</th>
                  <th className="py-3 pr-3 font-medium">Expires</th>
                  <th className="py-3 pr-3 font-medium">Status</th>
                  <th className="py-3 pr-5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {promos.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono font-semibold">{p.code}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      {formatPromoValue(p.type, p.value)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                      {p.redemptionCount}
                      {p.maxUses != null ? ` / ${p.maxUses}` : ""}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {p.expiresAt ? format(p.expiresAt, "MMM d, yyyy") : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      {p.isActive ? (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Off</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-5">
                      <form action={toggleResellerClientPromoAction}>
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
      </div>
    </div>
  );
}
