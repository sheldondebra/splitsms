"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveGeneralOfficeConfigAction } from "@/lib/actions/admin-general";
import type { GeneralOfficeConfig } from "@/lib/general-office/config";
import { Bell, Loader2 } from "lucide-react";

function SaveAlertsButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
      {pending ? "Saving…" : "Save alert settings"}
    </Button>
  );
}

export function GeneralNotifyForm({ config }: { config: GeneralOfficeConfig }) {
  return (
    <form
      key={config.updatedAt ?? "default"}
      action={saveGeneralOfficeConfigAction}
      className="space-y-5"
    >
      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          name="notifyAdminUsers"
          defaultChecked={config.notifyAdminUsers}
          className="h-4 w-4 rounded accent-primary mt-0.5"
        />
        <span>
          Notify all Admin and Super Admin users
          <span className="block text-xs text-muted-foreground mt-0.5">
            Uses email and phone on their accounts
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="notifyEmails">Extra alert emails</Label>
        <Textarea
          id="notifyEmails"
          name="notifyEmails"
          rows={3}
          placeholder={"ops@company.com\ngeneral@company.com"}
          defaultValue={config.notifyEmails.join("\n")}
          className="min-h-20 font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">One per line or comma-separated.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notifyPhones">Extra alert phone numbers</Label>
        <Textarea
          id="notifyPhones"
          name="notifyPhones"
          rows={3}
          placeholder="+233551234567"
          defaultValue={config.notifyPhones.join("\n")}
          className="min-h-20 font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          SMS alerts use the platform mNotify account (Admin → mNotify). Includes low balance warnings for
          mNotify and other providers.
        </p>
      </div>

      <SaveAlertsButton />
    </form>
  );
}
