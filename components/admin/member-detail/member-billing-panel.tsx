"use client";

import { useMemo, useState } from "react";
import {
  adminAdjustSmsCreditsAction,
  adminAdjustWalletAction,
} from "@/lib/actions/admin-members";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import { MaskedBalance } from "@/components/admin/member-detail/masked-balance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SMS_CREDIT_PACKAGES,
  formatWalletMoney,
  packageTotalCost,
} from "@/lib/billing/sms-packages";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Wallet } from "lucide-react";

const CREDIT_NOTE_PRESETS = [
  { id: "package", label: "Package credit" },
  { id: "promo", label: "Promo / goodwill" },
  { id: "support", label: "Support compensation" },
  { id: "purchase", label: "Manual purchase fulfillment" },
  { id: "correction", label: "Balance correction" },
  { id: "reclaim", label: "Reclaim unused credits" },
  { id: "custom", label: "Custom" },
] as const;

const WALLET_NOTE_PRESETS = [
  { id: "package", label: "Package top-up" },
  { id: "promo", label: "Promo / goodwill" },
  { id: "support", label: "Support compensation" },
  { id: "payment", label: "Payment reconciliation" },
  { id: "correction", label: "Balance correction" },
  { id: "refund", label: "Refund / debit" },
  { id: "custom", label: "Custom" },
] as const;

type NotePreset = { id: string; label: string };

function composeAdminNote(
  presets: readonly NotePreset[],
  presetId: string | null,
  custom: string,
) {
  const customTrimmed = custom.trim();
  if (!presetId || presetId === "custom") return customTrimmed;
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) return customTrimmed;
  return customTrimmed ? `${preset.label}. ${customTrimmed}` : preset.label;
}

function AdminNoteField({
  idPrefix,
  presets,
  presetId,
  onPresetChange,
  custom,
  onCustomChange,
}: {
  idPrefix: string;
  presets: readonly NotePreset[];
  presetId: string | null;
  onPresetChange: (id: string) => void;
  custom: string;
  onCustomChange: (value: string) => void;
}) {
  const composed = composeAdminNote(presets, presetId, custom);

  return (
    <div className="space-y-2">
      <Label className="text-xs">Note</Label>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const selected = presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetChange(preset.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-custom-note`} className="text-[11px] text-muted-foreground">
          {presetId === "custom" || !presetId
            ? "Custom note"
            : "Extra detail (optional)"}
        </Label>
        <Input
          id={`${idPrefix}-custom-note`}
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={
            presetId === "custom" || !presetId
              ? "Write a note for this adjustment"
              : "Add context for the member or audit trail"
          }
        />
      </div>
      <input type="hidden" name="note" value={composed} />
    </div>
  );
}

type Props = {
  userId: string;
  memberName: string;
  email: string | null;
  smsBalance: number;
  hasWallet: boolean;
  walletBalance: number;
  walletCurrency: string;
  pricePerCredit: number;
  pricingCurrency: string;
};

export function MemberBillingPanel({
  userId,
  email,
  smsBalance,
  hasWallet,
  walletBalance,
  walletCurrency,
  pricePerCredit,
  pricingCurrency,
}: Props) {
  const [creditPackageId, setCreditPackageId] = useState<string | null>("growth");
  const [creditAmount, setCreditAmount] = useState(() => {
    const pkg = SMS_CREDIT_PACKAGES.find((p) => p.id === "growth");
    return String(pkg?.credits ?? 500);
  });
  const [creditNotePreset, setCreditNotePreset] = useState<string>("package");
  const [creditCustomNote, setCreditCustomNote] = useState("Growth package");
  const [creditNotify, setCreditNotify] = useState(Boolean(email?.trim()));

  const [walletPackageId, setWalletPackageId] = useState<string | null>("growth");
  const [walletAmount, setWalletAmount] = useState(() => {
    const pkg = SMS_CREDIT_PACKAGES.find((p) => p.id === "growth");
    return String(packageTotalCost(pkg?.credits ?? 500, pricePerCredit));
  });
  const [walletNotePreset, setWalletNotePreset] = useState<string>("package");
  const [walletCustomNote, setWalletCustomNote] = useState("Growth package");
  const [walletNotify, setWalletNotify] = useState(Boolean(email?.trim()));

  const creditPackage = useMemo(
    () => SMS_CREDIT_PACKAGES.find((p) => p.id === creditPackageId) ?? null,
    [creditPackageId],
  );
  const walletPackage = useMemo(
    () => SMS_CREDIT_PACKAGES.find((p) => p.id === walletPackageId) ?? null,
    [walletPackageId],
  );

  function selectCreditPackage(id: string) {
    const pkg = SMS_CREDIT_PACKAGES.find((p) => p.id === id);
    if (!pkg) return;
    setCreditPackageId(id);
    setCreditAmount(String(pkg.credits));
    if (creditNotePreset === "custom" && creditCustomNote.trim()) return;
    setCreditNotePreset("package");
    if (!creditCustomNote.trim()) {
      setCreditCustomNote(`${pkg.name} package`);
    }
  }

  function selectWalletPackage(id: string) {
    const pkg = SMS_CREDIT_PACKAGES.find((p) => p.id === id);
    if (!pkg) return;
    setWalletPackageId(id);
    setWalletAmount(String(packageTotalCost(pkg.credits, pricePerCredit)));
    if (walletNotePreset === "custom" && walletCustomNote.trim()) return;
    setWalletNotePreset("package");
    if (!walletCustomNote.trim()) {
      setWalletCustomNote(`${pkg.name} package`);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminCard
        title="SMS credits"
        description="Credit packages or a custom adjustment"
      >
        <form action={adminAdjustSmsCreditsAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="packageId" value={creditPackageId ?? ""} />
          <input type="hidden" name="packageName" value={creditPackage?.name ?? ""} />
          <input type="hidden" name="notify" value={creditNotify ? "1" : "0"} />

          <div className="overflow-hidden rounded-xl bg-primary/[0.04] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Current balance
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
              {smsBalance.toLocaleString()}
              <span className="ml-2 text-sm font-normal text-muted-foreground">credits</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Select package</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {SMS_CREDIT_PACKAGES.map((pkg) => {
                const selected = creditPackageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => selectCreditPackage(pkg.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-2 text-left transition-colors",
                      selected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 hover:bg-muted/50",
                    )}
                  >
                    <span className="block text-xs font-semibold">{pkg.name}</span>
                    <span className="block text-[10px] text-muted-foreground tabular-nums">
                      +{pkg.credits.toLocaleString()} credits
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="credit-amount" className="text-xs">
              Adjust (+ / −)
            </Label>
            <Input
              id="credit-amount"
              name="amount"
              type="number"
              value={creditAmount}
              onChange={(e) => {
                setCreditAmount(e.target.value);
                setCreditPackageId(null);
              }}
              placeholder="100 or -50"
              required
              className="font-mono"
            />
          </div>

          <AdminNoteField
            idPrefix="credit"
            presets={CREDIT_NOTE_PRESETS}
            presetId={creditNotePreset}
            onPresetChange={setCreditNotePreset}
            custom={creditCustomNote}
            onCustomChange={setCreditCustomNote}
          />

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={creditNotify}
              onChange={(e) => setCreditNotify(e.target.checked)}
              disabled={!email?.trim()}
              className="rounded border-border"
            />
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {email?.trim()
              ? `Email ${email} about this change`
              : "No email on file to notify"}
          </label>

          <Button type="submit" className="w-full gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Apply credit adjustment
          </Button>
        </form>
      </AdminCard>

      <AdminCard
        title="Wallet"
        description="Top up using package amounts or a custom value"
      >
        {hasWallet ? (
          <form action={adminAdjustWalletAction} className="space-y-4">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="packageId" value={walletPackageId ?? ""} />
            <input type="hidden" name="packageName" value={walletPackage?.name ?? ""} />
            <input type="hidden" name="notify" value={walletNotify ? "1" : "0"} />

            <div className="overflow-hidden rounded-xl bg-muted/20 px-3.5 py-3 space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Current balance
              </p>
              <MaskedBalance amount={walletBalance} currency={walletCurrency} size="sm" />
              <p className="text-[10px] text-muted-foreground">
                Click the eye to reveal before adjusting.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Select package amount
                <span className="ml-1 font-normal text-muted-foreground">
                  ({formatWalletMoney(pricePerCredit, pricingCurrency)}/credit)
                </span>
              </Label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {SMS_CREDIT_PACKAGES.map((pkg) => {
                  const cost = packageTotalCost(pkg.credits, pricePerCredit);
                  const selected = walletPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => selectWalletPackage(pkg.id)}
                      className={cn(
                        "rounded-lg px-2.5 py-2 text-left transition-colors",
                        selected
                          ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                          : "bg-muted/30 hover:bg-muted/50",
                      )}
                    >
                      <span className="block text-xs font-semibold">{pkg.name}</span>
                      <span className="block text-[10px] text-muted-foreground tabular-nums">
                        +{formatWalletMoney(cost, pricingCurrency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wallet-amount" className="text-xs">
                Adjust (+ / −)
              </Label>
              <Input
                id="wallet-amount"
                name="amount"
                type="number"
                step="0.01"
                value={walletAmount}
                onChange={(e) => {
                  setWalletAmount(e.target.value);
                  setWalletPackageId(null);
                }}
                required
                className="font-mono"
              />
            </div>

            <AdminNoteField
              idPrefix="wallet"
              presets={WALLET_NOTE_PRESETS}
              presetId={walletNotePreset}
              onPresetChange={setWalletNotePreset}
              custom={walletCustomNote}
              onCustomChange={setWalletCustomNote}
            />

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={walletNotify}
                onChange={(e) => setWalletNotify(e.target.checked)}
                disabled={!email?.trim()}
                className="rounded border-border"
              />
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {email?.trim()
                ? `Email ${email} about this change`
                : "No email on file to notify"}
            </label>

            <Button type="submit" variant="secondary" className="w-full gap-1.5">
              <Wallet className="h-4 w-4" />
              Adjust wallet
            </Button>
          </form>
        ) : (
          <AdminEmpty>No wallet.</AdminEmpty>
        )}
      </AdminCard>
    </div>
  );
}
