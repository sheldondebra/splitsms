"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { AdminAlert, AdminCard } from "@/components/admin/admin-page-shell";
import {
  cancelManualPaymentJsonAction,
  pollManualPaymentChargeJsonAction,
  resolveManualPaymentNameJsonAction,
  startManualMobileMoneyChargeJsonAction,
  submitManualPaymentOtpJsonAction,
  submitManualPaymentPinJsonAction,
  type ManualPaymentStepResult,
} from "@/lib/actions/admin-manual-payment";
import { MOBILE_MONEY_NETWORKS } from "@/lib/payments/providers/mobile-money-networks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BadgeCheck,
  CheckCircle2,
  Contact,
  Loader2,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  ShieldAlert,
  Wallet,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MemberOption = { id: string; label: string; phone: string };

function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
        {n}
      </span>
      {children}
    </span>
  );
}

function MemberPicker({
  members,
  value,
  onChange,
  disabled,
}: {
  members: MemberOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 50);
    return members.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 50);
  }, [members, query]);

  return (
    <div
      ref={rootRef}
      className="space-y-2"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={selected ? selected.label : query}
          disabled={disabled}
          autoComplete="off"
          placeholder="Search members by name or phone…"
          className="h-9 pl-9 text-sm"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      {open ? (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-background shadow-sm">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No members match.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40",
                      m.id === value && "bg-primary/5",
                    )}
                    onClick={() => {
                      onChange(m.id);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    {m.label}
                    {m.id === value ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

type Phase =
  | { kind: "form" }
  | { kind: "resolving" }
  | { kind: "confirm"; accountName: string }
  | { kind: "charging" }
  | { kind: "otp"; paymentId: string; hint?: string }
  | { kind: "pin"; paymentId: string; hint?: string }
  | { kind: "offline"; paymentId: string; hint?: string }
  | { kind: "success"; paymentId: string }
  | { kind: "failed"; message: string };

const POLL_INTERVAL_MS = 4000;

export function ManualPaymentView({ members }: { members: MemberOption[] }) {
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneSource, setPhoneSource] = useState<"onFile" | "manual">("onFile");
  const [networkId, setNetworkId] = useState<string>(MOBILE_MONEY_NETWORKS[0].id);
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [pending, startTransition] = useTransition();

  const selectedMember = members.find((m) => m.id === targetUserId) ?? null;
  const amountNumber = Number(amount);
  const formValid = Boolean(targetUserId) && amountNumber > 0 && phone.trim().length >= 9;

  function selectMember(id: string | null) {
    setTargetUserId(id);
    const member = id ? members.find((m) => m.id === id) ?? null : null;
    if (member && phoneSource === "onFile") {
      setPhone(member.phone);
    }
    if (!member) {
      setPhoneSource("onFile");
      setPhone("");
    }
  }

  function useNumberOnFile() {
    setPhoneSource("onFile");
    if (selectedMember) setPhone(selectedMember.phone);
  }

  function useManualNumber() {
    setPhoneSource("manual");
    setPhone("");
  }

  function resetAll() {
    setPhase({ kind: "form" });
    setOtp("");
    setPin("");
  }

  function applyStepResult(result: ManualPaymentStepResult) {
    if (!result.ok) {
      toast.error("Payment failed", { description: result.error });
      setPhase({ kind: "failed", message: result.error });
      return;
    }
    if (result.credited) {
      toast.success("Wallet credited");
      setPhase({ kind: "success", paymentId: result.paymentId });
      return;
    }
    if (result.status === "send_otp") {
      setPhase({ kind: "otp", paymentId: result.paymentId, hint: result.displayText });
      return;
    }
    if (result.status === "send_pin") {
      setPhase({ kind: "pin", paymentId: result.paymentId, hint: result.displayText });
      return;
    }
    // pay_offline or pending — poll until it resolves.
    setPhase({ kind: "offline", paymentId: result.paymentId, hint: result.displayText });
  }

  function lookupName() {
    if (!formValid) {
      toast.error("Fill in the member, amount, and phone number first.");
      return;
    }
    setPhase({ kind: "resolving" });
    startTransition(async () => {
      const result = await resolveManualPaymentNameJsonAction({ phone, networkId });
      if (!result.ok) {
        toast.error("Could not look up this number", { description: result.error });
        setPhase({ kind: "form" });
        return;
      }
      setPhase({ kind: "confirm", accountName: result.accountName });
    });
  }

  function startCharge(accountName: string) {
    if (!targetUserId) return;
    setPhase({ kind: "charging" });
    startTransition(async () => {
      const result = await startManualMobileMoneyChargeJsonAction({
        targetUserId,
        phone,
        networkId,
        amount: amountNumber,
        confirmedAccountName: accountName,
      });
      applyStepResult(result);
    });
  }

  function submitOtp(paymentId: string) {
    if (!otp.trim()) {
      toast.error("Enter the code the customer gave you.");
      return;
    }
    startTransition(async () => {
      const result = await submitManualPaymentOtpJsonAction({ paymentId, otp });
      applyStepResult(result);
    });
  }

  function submitPin(paymentId: string) {
    if (!pin.trim()) {
      toast.error("Enter the PIN the customer gave you.");
      return;
    }
    startTransition(async () => {
      const result = await submitManualPaymentPinJsonAction({ paymentId, pin });
      applyStepResult(result);
    });
  }

  function checkNow(paymentId: string) {
    startTransition(async () => {
      const result = await pollManualPaymentChargeJsonAction({ paymentId });
      applyStepResult(result);
    });
  }

  function cancelCharge(paymentId: string) {
    startTransition(async () => {
      await cancelManualPaymentJsonAction({ paymentId });
      toast("Charge cancelled");
      resetAll();
    });
  }

  // Auto-poll while waiting for the customer to approve on their own phone.
  useEffect(() => {
    if (phase.kind !== "offline") return;
    const paymentId = phase.paymentId;
    const interval = setInterval(() => {
      startTransition(async () => {
        const result = await pollManualPaymentChargeJsonAction({ paymentId });
        if (result.ok && result.status === "pay_offline") return; // still waiting, no state change
        applyStepResult(result);
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind === "offline" ? phase.paymentId : null]);

  return (
    <div className="space-y-6">
      <AdminAlert variant="warning">
        <span className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Only collect a code or PIN directly from the account holder, on a call you placed to the
          number on file. Never ask for anyone else&rsquo;s mobile money PIN.
        </span>
      </AdminAlert>

      <AdminCard
        title={<StepTitle n={1}>Who and how much</StepTitle>}
        description="Pick the member to credit and the amount they're paying."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Credit which member</Label>
            <MemberPicker
              members={members}
              value={targetUserId}
              onChange={selectMember}
              disabled={phase.kind !== "form"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-amount" className="text-xs">
              Amount (GHS)
            </Label>
            <Input
              id="manual-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="50.00"
              disabled={phase.kind !== "form"}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title={<StepTitle n={2}>Mobile money number</StepTitle>}
        description="The number the customer is paying from — all networks supported."
      >
        {selectedMember ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={phoneSource === "onFile" ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              disabled={phase.kind !== "form"}
              onClick={useNumberOnFile}
            >
              <Contact className="h-3.5 w-3.5" />
              Use number on file ({selectedMember.phone})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={phoneSource === "manual" ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              disabled={phase.kind !== "form"}
              onClick={useManualNumber}
            >
              <Pencil className="h-3.5 w-3.5" />
              Enter a different number
            </Button>
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted-foreground">
            Pick a member above to offer their number on file, or just type one in below.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div className="space-y-1.5">
            <Label htmlFor="manual-phone" className="text-xs">
              Phone number
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="manual-phone"
                value={phone}
                onChange={(e) => {
                  setPhoneSource("manual");
                  setPhone(e.target.value);
                }}
                placeholder="024… / 055… / 020…"
                disabled={phase.kind !== "form" || (phoneSource === "onFile" && Boolean(selectedMember))}
                className="h-9 pl-9 text-sm"
              />
            </div>
            {phoneSource === "onFile" && selectedMember ? (
              <p className="text-xs text-muted-foreground">
                This is the number on file for {selectedMember.label.split(" · ")[0]}.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-network" className="text-xs">
              Network
            </Label>
            <select
              id="manual-network"
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value)}
              disabled={phase.kind !== "form"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {MOBILE_MONEY_NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {phase.kind === "form" ? (
          <Button
            type="button"
            className="mt-4 gap-1.5"
            disabled={!formValid || pending}
            onClick={lookupName}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Look up name
          </Button>
        ) : null}

        {phase.kind === "resolving" ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Looking up the account name…
          </p>
        ) : null}
      </AdminCard>

      {phase.kind === "confirm" ? (
        <AdminCard title={<StepTitle n={3}>Confirm before charging</StepTitle>}>
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mobile money account name
              </p>
              <p className="mt-1 text-lg font-semibold">{phase.accountName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Read this name back to the customer — confirm it matches before continuing.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Crediting</dt>
                <dd className="font-medium">{selectedMember?.label}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd className="font-medium">GHS {amountNumber.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium">{phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Network</dt>
                <dd className="font-medium">
                  {MOBILE_MONEY_NETWORKS.find((n) => n.id === networkId)?.label}
                </dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPhase({ kind: "form" })}>
                Back
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => startCharge(phase.accountName)}
                className="gap-1.5"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Yes, charge GHS {amountNumber.toFixed(2)}
              </Button>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {phase.kind === "charging" ? (
        <AdminCard title="Starting the charge">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Contacting Paystack…
          </p>
        </AdminCard>
      ) : null}

      {phase.kind === "otp" ? (
        <AdminCard title={<StepTitle n={4}>Enter the code from the customer</StepTitle>}>
          <div className="space-y-3">
            {phase.hint ? (
              <p className="text-sm text-muted-foreground">{phase.hint}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask the customer for the code sent to their phone (Vodafone: dial *110# to generate a
                voucher code).
              </p>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="manual-otp" className="text-xs">
                  Code
                </Label>
                <Input
                  id="manual-otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="off"
                  className="h-9 w-48 text-sm"
                  disabled={pending}
                />
              </div>
              <Button type="button" disabled={pending} onClick={() => submitOtp(phase.paymentId)} className="gap-1.5">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit code
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => cancelCharge(phase.paymentId)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {phase.kind === "pin" ? (
        <AdminCard title={<StepTitle n={4}>Enter the mobile money PIN</StepTitle>}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {phase.hint || "Ask the customer for their mobile money PIN to authorize this payment."}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="manual-pin" className="text-xs">
                  PIN
                </Label>
                <Input
                  id="manual-pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoComplete="off"
                  className="h-9 w-48 text-sm"
                  disabled={pending}
                />
              </div>
              <Button type="button" disabled={pending} onClick={() => submitPin(phase.paymentId)} className="gap-1.5">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit PIN
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => cancelCharge(phase.paymentId)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {phase.kind === "offline" ? (
        <AdminCard title={<StepTitle n={4}>Waiting for the customer to approve</StepTitle>}>
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {phase.hint || "Ask the customer to check their phone and approve the payment prompt."}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => checkNow(phase.paymentId)}>
                Check now
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => cancelCharge(phase.paymentId)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {phase.kind === "success" ? (
        <AdminCard>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Wallet credited</p>
              <p className="text-sm text-muted-foreground">
                GHS {amountNumber.toFixed(2)} added to {selectedMember?.label}.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                selectMember(null);
                setAmount("");
                resetAll();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start another manual payment
            </Button>
          </div>
        </AdminCard>
      ) : null}

      {phase.kind === "failed" ? (
        <AdminCard>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Payment failed</p>
              <p className="text-sm text-muted-foreground">{phase.message}</p>
            </div>
            <Button type="button" variant="outline" className="gap-1.5" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        </AdminCard>
      ) : null}
    </div>
  );
}
