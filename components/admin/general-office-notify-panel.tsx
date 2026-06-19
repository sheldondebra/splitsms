import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { saveGeneralOfficeConfigAction } from "@/lib/actions/admin-general";
import type { GeneralOfficeConfig } from "@/lib/general-office/config";
import { Bell } from "lucide-react";

type GeneralOfficeNotifyPanelProps = {
  config: GeneralOfficeConfig;
};

export function GeneralOfficeNotifyPanel({ config }: GeneralOfficeNotifyPanelProps) {
  return (
    <AdminCard
      title="Sender ID alerts"
      description="Who receives email and SMS when a member requests a new sender ID."
      actions={
        <Badge variant="secondary">
          {config.notifyEmails.length + config.notifyPhones.length} extra contacts
        </Badge>
      }
    >
      <form action={saveGeneralOfficeConfigAction} className="space-y-5">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="notifyAdminUsers"
            defaultChecked={config.notifyAdminUsers}
            className="h-4 w-4 rounded accent-primary"
          />
          Notify all Admin and Super Admin users (email + phone on their accounts)
        </label>

        <div className="space-y-2">
          <Label htmlFor="notifyEmails">Extra alert emails</Label>
          <Textarea
            id="notifyEmails"
            name="notifyEmails"
            rows={3}
            placeholder="ops@company.com, general@company.com"
            defaultValue={config.notifyEmails.join("\n")}
            className="font-mono text-xs"
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
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            SMS alerts use the platform mNotify account (Admin → mNotify).
          </p>
        </div>

        <Button type="submit" className="gap-2">
          <Bell className="h-4 w-4" />
          Save alert settings
        </Button>
      </form>
    </AdminCard>
  );
}
