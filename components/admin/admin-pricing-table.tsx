"use client";

import { useMemo, useState } from "react";
import { updateCountryPricingAction } from "@/lib/actions/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminPricingRow = {
  id: string;
  countryCode: string;
  countryName: string;
  dialCode: string;
  memberPrice: string;
  costPrice: string;
  creditsPerSms: number;
  currency: string;
  provider: string;
  isActive: boolean;
};

export function AdminPricingTable({ rows }: { rows: AdminPricingRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.countryName.toLowerCase().includes(q) ||
        r.countryCode.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search country or provider…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{activeCount}</span> active on public
          pricing · {rows.length} total
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1.4fr_repeat(6,1fr)_auto] gap-3 px-4 py-3 bg-muted/40 text-xs font-semibold text-muted-foreground border-b">
          <span>Country</span>
          <span>Cost</span>
          <span>Sell (public)</span>
          <span>Credits</span>
          <span>Currency</span>
          <span>Provider</span>
          <span>Status</span>
          <span />
        </div>

        <div className="divide-y divide-border/50 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((p) => {
              const profit =
                Number(p.memberPrice) - Number(p.costPrice);
              return (
                <form
                  key={p.id}
                  action={updateCountryPricingAction}
                  className="grid gap-4 p-4 lg:grid-cols-[1.4fr_repeat(6,1fr)_auto] lg:items-end lg:gap-3 hover:bg-muted/20 transition-colors"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-semibold">{p.countryName}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {p.countryCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.dialCode}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Margin: {profit.toFixed(4)} {p.currency}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs lg:sr-only">Cost</Label>
                    <Input
                      name="costPrice"
                      type="number"
                      step="0.0001"
                      min={0}
                      defaultValue={p.costPrice}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs lg:sr-only">Sell</Label>
                    <Input
                      name="memberPrice"
                      type="number"
                      step="0.0001"
                      min={0}
                      defaultValue={p.memberPrice}
                      className="h-9 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs lg:sr-only">Credits</Label>
                    <Input
                      name="creditsPerSms"
                      type="number"
                      min={1}
                      defaultValue={p.creditsPerSms}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs lg:sr-only">Currency</Label>
                    <Input name="currency" defaultValue={p.currency} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs lg:sr-only">Provider</Label>
                    <Input name="provider" defaultValue={p.provider} className="h-9" />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={p.isActive}
                        className="rounded"
                      />
                      <span className={cn(!p.isActive && "text-muted-foreground")}>
                        {p.isActive ? "Live" : "Hidden"}
                      </span>
                    </label>
                  </div>
                  <Button type="submit" size="sm" className="gap-1.5 shrink-0">
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </form>
              );
            })
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Inactive countries are hidden on{" "}
        <a href="/pricing" className="text-primary font-medium hover:underline" target="_blank" rel="noreferrer">
          /pricing
        </a>
        . Changes apply immediately after save.
      </p>
    </div>
  );
}
