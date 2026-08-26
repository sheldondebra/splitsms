"use client";

import { useState } from "react";
import Link from "next/link";
import { saveRoutingPolicyAction } from "@/lib/actions/admin-routes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { SenderRegistrationMode } from "@/lib/sms/routing-policy";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

const PROVIDERS: { type: SmsProviderType; label: string }[] = [
  { type: "MNOTIFY", label: "mNotify" },
  { type: "TWILIO", label: "Twilio" },
  { type: "INFOBIP", label: "Infobip" },
];

const SENDER_MODES: { value: SenderRegistrationMode; label: string; hint: string }[] = [
  {
    value: "BY_COUNTRY",
    label: "By country route",
    hint: "Same failover chain as SMS for that country.",
  },
  {
    value: "ALL",
    label: "All providers",
    hint: "Register with mNotify, Twilio, and Infobip every time.",
  },
  {
    value: "SELECTED",
    label: "Selected providers",
    hint: "Only the providers you tick below.",
  },
];

function ToggleRow({
  name,
  checked,
  onCheckedChange,
  title,
  hint,
}: {
  name: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5">{title}</p>
        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{hint}</p>
      </div>
      <Checkbox
        name={name}
        checked={checked}
        onChange={(e) => onCheckedChange(e.currentTarget.checked)}
        className="mt-0.5"
      />
    </div>
  );
}

export function RoutingPolicyForm({
  policy,
  mnotifyConfigured,
}: {
  policy: {
    autoRouteByRecipient: boolean;
    routingLogEnabled: boolean;
    senderRegistrationMode: SenderRegistrationMode;
    senderRegistrationProviders: SmsProviderType[];
    mnotifyFirst: boolean;
    allowFailover: boolean;
  };
  mnotifyConfigured: boolean;
}) {
  const [autoRoute, setAutoRoute] = useState(policy.autoRouteByRecipient);
  const [logSwitches, setLogSwitches] = useState(policy.routingLogEnabled);
  const [mnotifyFirst, setMnotifyFirst] = useState(policy.mnotifyFirst);
  const [allowFailover, setAllowFailover] = useState(policy.allowFailover);
  const [senderMode, setSenderMode] = useState<SenderRegistrationMode>(
    policy.senderRegistrationMode,
  );
  const [selected, setSelected] = useState<SmsProviderType[]>(
    policy.senderRegistrationProviders,
  );

  return (
    <form action={saveRoutingPolicyAction} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            SMS routing
          </p>
          <ToggleRow
            name="autoRouteByRecipient"
            checked={autoRoute}
            onCheckedChange={setAutoRoute}
            title="Auto-route by recipient"
            hint="Pick the country chain from the destination number (US → Twilio, GH → mNotify)."
          />
          <ToggleRow
            name="routingLogEnabled"
            checked={logSwitches}
            onCheckedChange={setLogSwitches}
            title="Log provider switches"
            hint="Record each routing decision in the switch log."
          />

          {autoRoute ? (
            <p className="px-1 text-[11px] leading-4 text-muted-foreground">
              Country chains below are live. Legacy “mNotify first” is ignored while auto-route is on.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleRow
                name="mnotifyFirst"
                checked={mnotifyFirst}
                onCheckedChange={setMnotifyFirst}
                title="mNotify first"
                hint="Legacy default when auto-route is off."
              />
              <ToggleRow
                name="allowFailover"
                checked={allowFailover}
                onCheckedChange={setAllowFailover}
                title="Allow failover"
                hint="Fall through the chain if the primary fails."
              />
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sender ID registration
          </p>
          <div className="space-y-2">
            {SENDER_MODES.map((mode) => {
              const active = senderMode === mode.value;
              return (
                <label
                  key={mode.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                    active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-background hover:bg-muted/20",
                  )}
                >
                  <input
                    type="radio"
                    name="senderRegistrationMode"
                    value={mode.value}
                    checked={active}
                    onChange={() => setSenderMode(mode.value)}
                    className="mt-1 accent-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-5">{mode.label}</p>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{mode.hint}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {senderMode === "SELECTED" ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {PROVIDERS.map((provider) => {
                const on = selected.includes(provider.type);
                return (
                  <div
                    key={provider.type}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      on
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/70 bg-background text-muted-foreground",
                    )}
                  >
                    <Checkbox
                      name={`reg_${provider.type}`}
                      checked={on}
                      onChange={(e) => {
                        const next = e.currentTarget.checked;
                        setSelected((current) =>
                          next
                            ? [...current, provider.type]
                            : current.filter((item) => item !== provider.type),
                        );
                      }}
                    />
                    {provider.label}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
        <p className="text-xs text-muted-foreground">
          mNotify{" "}
          {mnotifyConfigured ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-300">configured</span>
          ) : (
            <Link href="/admin/providers" className="font-medium text-primary hover:underline">
              needs setup →
            </Link>
          )}
        </p>
        <Button type="submit" size="sm">
          Save policy
        </Button>
      </div>
    </form>
  );
}
