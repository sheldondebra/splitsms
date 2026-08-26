"use client";

import { useState } from "react";
import { adminSaveEmailAutomationSettingsAction } from "@/lib/actions/admin-email-marketing";
import type { EmailAutomationSettings } from "@/lib/email/automation-settings";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background px-3.5 py-3">
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
    </label>
  );
}

export function EmailAutomationsForm({ settings }: { settings: EmailAutomationSettings }) {
  const [welcomeOnSignup, setWelcomeOnSignup] = useState(settings.welcomeOnSignup);
  const [failedLoginHelp, setFailedLoginHelp] = useState(settings.failedLoginHelp);
  const [resetPasswordOtp, setResetPasswordOtp] = useState(settings.resetPasswordOtp);
  const [inactiveMembers, setInactiveMembers] = useState(settings.inactiveMembers);
  const [lowBalanceTopup, setLowBalanceTopup] = useState(settings.lowBalanceTopup);

  return (
    <AdminCard
      title="Automatic emails"
      description="Turn each message on or off. They use the same layout as campaigns: header, body, button, one footer with www.splitsms.com."
    >
      <form action={adminSaveEmailAutomationSettingsAction} className="space-y-3">
        <ToggleRow
          name="welcomeOnSignup"
          checked={welcomeOnSignup}
          onCheckedChange={setWelcomeOnSignup}
          title="Welcome after signup"
          hint="Login URL, email, get-started checklist, and Smart Forms. We never send the password."
        />
        <ToggleRow
          name="failedLoginHelp"
          checked={failedLoginHelp}
          onCheckedChange={setFailedLoginHelp}
          title="Two failed sign-ins"
          hint="After two wrong passwords, send login details and a forgot-password link."
        />
        <ToggleRow
          name="resetPasswordOtp"
          checked={resetPasswordOtp}
          onCheckedChange={setResetPasswordOtp}
          title="Password-reset code"
          hint="Email the OTP when someone requests a password reset."
        />
        <ToggleRow
          name="inactiveMembers"
          checked={inactiveMembers}
          onCheckedChange={setInactiveMembers}
          title="Inactive members"
          hint="Nudge members who have not signed in for the number of days below."
        />
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3.5 py-3">
          <Label htmlFor="inactiveDays" className="min-w-0 flex-1 text-sm font-medium">
            Inactive after (days)
          </Label>
          <Input
            id="inactiveDays"
            name="inactiveDays"
            type="number"
            min={7}
            max={365}
            defaultValue={settings.inactiveDays}
            className="h-9 w-24"
          />
        </div>
        <ToggleRow
          name="lowBalanceTopup"
          checked={lowBalanceTopup}
          onCheckedChange={setLowBalanceTopup}
          title="Low wallet / cannot send SMS"
          hint="When credits fall to 10 or below, email a top-up link."
        />
        <div className="pt-2">
          <Button type="submit">Save automations</Button>
        </div>
      </form>
    </AdminCard>
  );
}
