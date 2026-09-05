"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getMaintenanceAudienceSizeAction,
  saveMaintenanceTemplatesAction,
  toggleMaintenanceModeAction,
} from "@/lib/actions/admin-maintenance";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaintenanceConfig } from "@/lib/admin/maintenance";

export function GeneralMaintenancePanel({ config }: { config: MaintenanceConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savingTemplates, startSavingTemplates] = useTransition();

  const [message, setMessage] = useState(config.message);
  const [startEmailSubject, setStartEmailSubject] = useState(config.startEmailSubject);
  const [startEmailBody, setStartEmailBody] = useState(config.startEmailBody);
  const [startSmsBody, setStartSmsBody] = useState(config.startSmsBody);
  const [endEmailSubject, setEndEmailSubject] = useState(config.endEmailSubject);
  const [endEmailBody, setEndEmailBody] = useState(config.endEmailBody);
  const [endSmsBody, setEndSmsBody] = useState(config.endSmsBody);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [audienceSize, setAudienceSize] = useState<number | null>(null);
  const nextEnabled = !config.enabled;

  async function openConfirm() {
    setConfirmOpen(true);
    const size = await getMaintenanceAudienceSizeAction().catch(() => null);
    setAudienceSize(size);
  }

  function runToggle() {
    startTransition(async () => {
      const result = await toggleMaintenanceModeAction({
        enabled: nextEnabled,
        notifyEmail,
        notifySms,
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setConfirmOpen(false);
      router.refresh();
    });
  }

  function saveTemplates() {
    startSavingTemplates(async () => {
      const result = await saveMaintenanceTemplatesAction({
        message,
        startEmailSubject,
        startEmailBody,
        startSmsBody,
        endEmailSubject,
        endEmailBody,
        endSmsBody,
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Maintenance mode"
        description="When on, members and resellers are shown a maintenance page instead of the dashboard. Admins keep full access."
        actions={
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              config.enabled
                ? "border-amber-500/40 text-amber-800 dark:text-amber-200"
                : "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
            )}
          >
            {config.enabled ? "Under maintenance" : "Online"}
          </Badge>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {config.enabled ? "Platform is currently under maintenance" : "Platform is online"}
              </p>
              {config.startedAt ? (
                <p className="text-xs text-muted-foreground">
                  Since {new Date(config.startedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant={config.enabled ? "outline" : "default"}
            onClick={() => void openConfirm()}
            className="shrink-0"
          >
            {config.enabled ? "Turn maintenance off" : "Turn maintenance on"}
          </Button>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="maintenance-message">Message shown on the maintenance page</Label>
          <Textarea
            id="maintenance-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
      </AdminCard>

      <AdminCard
        title="Notification messages"
        description="Pre-written, professional copy sent to members when maintenance starts and ends. Edit as needed."
        dense
      >
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When maintenance starts
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-email-subject">Email subject</Label>
                <Input
                  id="start-email-subject"
                  value={startEmailSubject}
                  onChange={(e) => setStartEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-email-body">Email body</Label>
                <Textarea
                  id="start-email-body"
                  value={startEmailBody}
                  onChange={(e) => setStartEmailBody(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-sms-body">SMS text</Label>
                <Textarea
                  id="start-sms-body"
                  value={startSmsBody}
                  onChange={(e) => setStartSmsBody(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When maintenance ends
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="end-email-subject">Email subject</Label>
                <Input
                  id="end-email-subject"
                  value={endEmailSubject}
                  onChange={(e) => setEndEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-email-body">Email body</Label>
                <Textarea
                  id="end-email-body"
                  value={endEmailBody}
                  onChange={(e) => setEndEmailBody(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-sms-body">SMS text</Label>
                <Textarea
                  id="end-sms-body"
                  value={endSmsBody}
                  onChange={(e) => setEndSmsBody(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Button type="button" onClick={saveTemplates} disabled={savingTemplates} className="gap-1.5">
            {savingTemplates ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save messages
          </Button>
        </div>
      </AdminCard>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {nextEnabled ? "Turn maintenance mode on?" : "Turn maintenance mode off?"}
            </DialogTitle>
            <DialogDescription>
              {nextEnabled
                ? "Members and resellers will be redirected to the maintenance page immediately."
                : "Members and resellers will regain access to the dashboard immediately."}
              {audienceSize != null ? ` This affects ~${audienceSize.toLocaleString()} members.` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              Notify members by email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              Notify members by SMS
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={runToggle} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {nextEnabled ? "Turn on" : "Turn off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
