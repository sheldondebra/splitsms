"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { PublicPricingRow } from "@/lib/billing/public-pricing";
import {
  type CustomRate,
  formatPrice,
  resolveMemberPrice,
  lowestRate,
  exportRatesCsv,
} from "@/lib/billing/pricing-format";
import { countSmsUnits } from "@/lib/sms/units";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import {
  AppCard,
  AppCardBody,
  MobileCardList,
  MobileCardItem,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Globe,
  Search,
  Calculator,
  Bookmark,
  Download,
  Trash2,
  Pencil,
  Plus,
  Coins,
  MessageSquare,
  Server,
  Sparkles,
  Wallet,
  Send,
} from "lucide-react";

const STORAGE_KEY = "splitsms-pricing-estimates";

export type SavedEstimate = {
  id: string;
  name: string;
  countryCode: string;
  message: string;
  recipients: number;
  segments: number;
  credits: number;
  totalCost: number;
  currency: string;
  updatedAt: string;
};

export type MemberPricingDashboardProps = {
  rows: PublicPricingRow[];
  selectedCode: string;
  customRates: CustomRate[];
  smsCredits: number;
  walletCurrency: string;
};

function loadEstimates(): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedEstimate[];
  } catch {
    return [];
  }
}

function persistEstimates(items: SavedEstimate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function MemberPricingDashboard({
  rows,
  selectedCode,
  customRates,
  smsCredits,
}: MemberPricingDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [estimateName, setEstimateName] = useState("");
  const [calcMessage, setCalcMessage] = useState("Hello {firstName}, your order is ready.");
  const [calcRecipients, setCalcRecipients] = useState("100");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const customByCode = useMemo(
    () => Object.fromEntries(customRates.map((c) => [c.countryCode, c])),
    [customRates],
  );

  const selected = rows.find((r) => r.countryCode === selectedCode) ?? rows[0] ?? null;
  const selectedResolved = selected ? resolveMemberPrice(selected, customByCode) : null;

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

  const low = lowestRate(rows, customByCode);
  const customCount = customRates.length;

  const segments = countSmsUnits(calcMessage);
  const recipientCount = Math.max(0, Number(calcRecipients) || 0);
  const calcCredits = segments * recipientCount * (selected?.creditsPerSms ?? 1);
  const calcCost = selectedResolved ? calcCredits * selectedResolved.price : 0;

  useEffect(() => {
    setEstimates(loadEstimates());
  }, []);

  function onCountryChange(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.push(`/dashboard/pricing?${params.toString()}`, { scroll: false });
  }

  function downloadCsv() {
    const blob = new Blob([exportRatesCsv(rows, customByCode)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "splitsms-rates.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const saveEstimate = useCallback(() => {
    if (!selected || !selectedResolved) return;
    const name =
      estimateName.trim() ||
      `${selected.countryName} · ${recipientCount} recipients`;
    const payload: SavedEstimate = {
      id: editingId ?? crypto.randomUUID(),
      name,
      countryCode: selected.countryCode,
      message: calcMessage,
      recipients: recipientCount,
      segments,
      credits: calcCredits,
      totalCost: calcCost,
      currency: selectedResolved.currency,
      updatedAt: new Date().toISOString(),
    };
    const next = editingId
      ? estimates.map((e) => (e.id === editingId ? payload : e))
      : [payload, ...estimates];
    setEstimates(next);
    persistEstimates(next);
    setEditingId(null);
    setEstimateName("");
    setSavedNotice(editingId ? "Estimate updated." : "Estimate saved.");
    window.setTimeout(() => setSavedNotice(null), 3000);
  }, [
    calcCost,
    calcCredits,
    calcMessage,
    editingId,
    estimateName,
    estimates,
    recipientCount,
    segments,
    selected,
    selectedResolved,
  ]);

  function loadEstimate(est: SavedEstimate) {
    onCountryChange(est.countryCode);
    setCalcMessage(est.message);
    setCalcRecipients(String(est.recipients));
    setEstimateName(est.name);
    setEditingId(est.id);
  }

  function deleteEstimate(id: string) {
    const next = estimates.filter((e) => e.id !== id);
    setEstimates(next);
    persistEstimates(next);
    if (editingId === id) {
      setEditingId(null);
      setEstimateName("");
    }
  }

  if (!selected || !selectedResolved) {
    return (
      <AppCard>
        <AppCardBody className="py-14 text-center">
          <p className="text-muted-foreground">No pricing configured yet.</p>
          <Link
            href="/dashboard/support"
            className="mt-4 inline-block text-sm font-medium text-primary"
          >
            Contact support
          </Link>
        </AppCardBody>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {savedNotice && <FriendlyAlert success="1" successMessage={savedNotice} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Countries", value: rows.length.toString() },
          {
            label: "From",
            value: low ? formatPrice(low.price, low.currency) : "—",
          },
          { label: "Custom rates", value: customCount.toString() },
          { label: "Your credits", value: smsCredits.toLocaleString() },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5 xl:gap-8">
        <div className="space-y-6 xl:col-span-3">
          <AppCard>
            <AppCardBody className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <Label
                    htmlFor="pricing-country"
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    <Globe className="h-4 w-4 text-primary" />
                    Destination country
                  </Label>
                  <select
                    id="pricing-country"
                    value={selected.countryCode}
                    onChange={(e) => onCountryChange(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                  >
                    {rows.map((r) => (
                      <option key={r.countryCode} value={r.countryCode}>
                        {r.countryName} ({r.countryCode}) · {r.dialCode}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 gap-2"
                  onClick={downloadCsv}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Your rate
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">{selected.countryName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selected.dialCode} · {selected.provider}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedResolved.isCustom && (
                      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                        <Sparkles className="h-3 w-3" />
                        Custom rate
                      </Badge>
                    )}
                    <Badge variant="outline">{selected.countryCode}</Badge>
                  </div>
                </div>

                <p className="mt-6 text-4xl font-bold tabular-nums text-primary sm:text-5xl">
                  {formatPrice(selectedResolved.price, selectedResolved.currency)}
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    / segment
                  </span>
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Coins, label: "Credits", value: `${selected.creditsPerSms} per segment` },
                    { icon: MessageSquare, label: "Encoding", value: "GSM-7 or Unicode" },
                    { icon: Server, label: "Route", value: selected.provider },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-3"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AppCardBody>
          </AppCard>

          <AppCard>
            <AppCardBody className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">All rates</h3>
                  <p className="text-sm text-muted-foreground">{filtered.length} countries</p>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search country…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
              </div>

              <MobileCardList>
                {filtered.map((r) => {
                  const resolved = resolveMemberPrice(r, customByCode);
                  const active = r.countryCode === selected.countryCode;
                  return (
                    <MobileCardItem
                      key={r.id}
                      className={cn(active && "border-primary/40 bg-primary/5")}
                    >
                      <button
                        type="button"
                        onClick={() => onCountryChange(r.countryCode)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{r.countryName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.countryCode} · {r.creditsPerSms} credit(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold tabular-nums">
                            {formatPrice(resolved.price, resolved.currency)}
                          </p>
                          {resolved.isCustom && (
                            <span className="text-[10px] font-medium text-primary">Custom</span>
                          )}
                        </div>
                      </button>
                    </MobileCardItem>
                  );
                })}
              </MobileCardList>

              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Country</th>
                      <th className="px-5 py-3 font-medium">Code</th>
                      <th className="px-5 py-3 font-medium text-right">Your rate</th>
                      <th className="px-5 py-3 font-medium text-right">Credits</th>
                      <th className="hidden px-5 py-3 font-medium lg:table-cell">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const resolved = resolveMemberPrice(r, customByCode);
                      const active = r.countryCode === selected.countryCode;
                      return (
                        <tr
                          key={r.id}
                          className={cn(
                            "border-b border-border/40 last:border-0",
                            active && "bg-primary/5",
                          )}
                        >
                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => onCountryChange(r.countryCode)}
                              className={cn(
                                "font-medium hover:text-primary",
                                active && "text-primary",
                              )}
                            >
                              {r.countryName}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                            {r.countryCode}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                            {formatPrice(resolved.price, resolved.currency)}
                            {resolved.isCustom && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                Custom
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right text-muted-foreground">
                            {r.creditsPerSms}
                          </td>
                          <td className="hidden px-5 py-3.5 text-muted-foreground lg:table-cell">
                            {r.provider}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AppCardBody>
          </AppCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <AppCard>
            <AppCardBody className="space-y-5">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Cost calculator</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc-message">Sample message</Label>
                <Textarea
                  id="calc-message"
                  rows={3}
                  value={calcMessage}
                  onChange={(e) => setCalcMessage(e.target.value)}
                  className="min-h-[88px] text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {segments} segment{segments === 1 ? "" : "s"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc-recipients">Recipients</Label>
                <Input
                  id="calc-recipients"
                  type="number"
                  min={1}
                  value={calcRecipients}
                  onChange={(e) => setCalcRecipients(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/25 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits needed</span>
                  <span className="font-bold tabular-nums">{calcCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated charge</span>
                  <span className="font-bold tabular-nums text-primary">
                    {formatPrice(calcCost, selectedResolved.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your balance</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      calcCredits > smsCredits && "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {smsCredits.toLocaleString()} SMS
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimate-name">Save as (optional)</Label>
                <Input
                  id="estimate-name"
                  placeholder="Campaign to Accra customers"
                  value={estimateName}
                  onChange={(e) => setEstimateName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-11 min-w-[140px] flex-1 gap-2"
                  onClick={saveEstimate}
                >
                  {editingId ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Update estimate
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Save estimate
                    </>
                  )}
                </Button>
                {calcCredits > smsCredits && (
                  <Link
                    href="/dashboard/wallet"
                    className="inline-flex h-11 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/15"
                  >
                    <Wallet className="h-4 w-4" />
                    Top up
                  </Link>
                )}
              </div>

              <Link
                href={`/dashboard/send?country=${selected.countryCode}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/60 text-sm font-semibold hover:bg-muted/50"
              >
                <Send className="h-4 w-4" />
                Send SMS to {selected.countryCode}
              </Link>
            </AppCardBody>
          </AppCard>

          <AppCard>
            <AppCardBody className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Saved estimates</h3>
                </div>
                <Badge variant="secondary">{estimates.length}</Badge>
              </div>

              {estimates.length === 0 ? (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Save calculator scenarios to compare campaigns later.
                </p>
              ) : (
                <ul className="space-y-2">
                  {estimates.map((est) => (
                    <li
                      key={est.id}
                      className="rounded-xl border border-border/60 bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => loadEstimate(est)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate font-semibold text-foreground">{est.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {est.countryCode} · {est.recipients.toLocaleString()} recipients ·{" "}
                            {est.segments} seg
                          </p>
                          <p className="mt-2 text-sm font-bold tabular-nums text-primary">
                            {formatPrice(est.totalCost, est.currency)}
                          </p>
                        </button>
                        <div className="flex shrink-0 flex-col gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => loadEstimate(est)}
                            aria-label="Edit estimate"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteEstimate(est.id)}
                            aria-label="Delete estimate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AppCardBody>
          </AppCard>

          {customRates.length > 0 && (
            <AppCard>
              <AppCardBody className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Your custom rates
                </h3>
                <p className="text-sm text-muted-foreground">
                  Negotiated rates applied by SplitSMS for your account.
                </p>
                <ul className="space-y-2">
                  {customRates.map((c) => {
                    const row = rows.find((r) => r.countryCode === c.countryCode);
                    return (
                      <li
                        key={c.countryCode}
                        className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 text-sm"
                      >
                        <span className="font-medium">{row?.countryName ?? c.countryCode}</span>
                        <span className="font-bold tabular-nums text-primary">
                          {formatPrice(c.sellPrice, c.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </AppCardBody>
            </AppCard>
          )}
        </div>
      </div>
    </div>
  );
}
