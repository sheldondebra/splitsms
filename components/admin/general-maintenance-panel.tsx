"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getMaintenanceAudienceSizeAction,
  saveMaintenanceTemplatesAction,
  setMaintenanceScheduleAction,
  toggleMaintenanceModeAction,
} from "@/lib/actions/admin-maintenance";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Wrench, Mail, MessageSquare, CalendarClock, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaintenanceConfig } from "@/lib/admin/maintenance";

/** Local datetime-input value (no timezone) from an ISO string, or "". */
function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GeneralMaintenancePanel({ config }: { config: MaintenanceConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savingTemplates, startSavingTemplates] = useTransition();
  const [savingSchedule, startSavingSchedule] = useTransition();

  const [message, setMessage] = useState(config.message);
  const [startEmailSubject, setStartEmailSubject] = useState(config.startEmailSubject);
  const [startEmailBody, setStartEmailBody] = useState(config.startEmailBody);
  const [startSmsBody, setStartSmsBody] = useState(config.startSmsBody);
  const [endEmailSubject, setEndEmailSubject] = useState(config.endEmailSubject);
  const [endEmailBody, setEndEmailBody] = useState(config.endEmailBody);
  const [endSmsBody, setEndSmsBody] = useState(config.endSmsBody);
  const [scheduleInput, setScheduleInput] = useState(toLocalInputValue(config.scheduledEndAt));

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

  function saveSchedule() {
    startSavingSchedule(async () => {
      const scheduledEndAt = scheduleInput ? new Date(scheduleInput).toISOString() : null;
      const result = await setMaintenanceScheduleAction({ scheduledEndAt });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  function clearSchedule() {
    setScheduleInput("");
    startSavingSchedule(async () => {
      const result = await setMaintenanceScheduleAction({ scheduledEndAt: null });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                config.enabled ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-primary/15 text-primary",
              )}
            >
              <Wrench className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Maintenance mode</p>
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
              </div>
              <p className="max-w-md text-xs text-muted-foreground">
                When on, members and resellers see a maintenance page instead of the dashboard.
                Admins always keep full access.
              </p>
              {config.startedAt && config.enabled ? (
                <p className="text-xs text-muted-foreground">
                  Since {format(new Date(config.startedAt), "MMM d, yyyy · HH:mm")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              {config.enabled ? "On" : "Off"}
            </span>
            <Switch
              checked={config.enabled}
              onCheckedChange={() => void openConfirm()}
              aria-label="Toggle maintenance mode"
            />
          </div>
        </div>

        {config.enabled ? (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/15 p-3.5">
            <Label htmlFor="maintenance-schedule" className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="h-3.5 w-3.5" />
              Automatically turn off at
            </Label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <Input
                id="maintenance-schedule"
                type="datetime-local"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                className="sm:max-w-[220px]"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={saveSchedule} disabled={savingSchedule || !scheduleInput}>
                  {savingSchedule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                </Button>
                {config.scheduledEndAt ? (
                  <Button type="button" size="sm" variant="outline" onClick={clearSchedule} disabled={savingSchedule}>
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
            {config.scheduledEndAt ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Scheduled to turn off automatically at{" "}
                {format(new Date(config.scheduledEndAt), "MMM d, yyyy · HH:mm")}. No notification is
                sent automatically — turn it off manually if you want to notify members.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Optional — leave blank to turn it off manually whenever you&apos;re ready.
              </p>
            )}
          </div>
        ) : null}

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
        <div className="space-y-5">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <LogOut className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-semibold">When maintenance starts</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start-email-subject" className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email subject
                </Label>
                <Input
                  id="start-email-subject"
                  value={startEmailSubject}
                  onChange={(e) => setStartEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-sms-body" className="flex items-center gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" /> SMS text
                </Label>
                <Textarea
                  id="start-sms-body"
                  value={startSmsBody}
                  onChange={(e) => setStartSmsBody(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="start-email-body" className="text-xs">
                  Email body
                </Label>
                <Textarea
                  id="start-email-body"
                  value={startEmailBody}
                  onChange={(e) => setStartEmailBody(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <LogIn className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-semibold">When maintenance ends</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="end-email-subject" className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email subject
                </Label>
                <Input
                  id="end-email-subject"
                  value={endEmailSubject}
                  onChange={(e) => setEndEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-sms-body" className="flex items-center gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" /> SMS text
                </Label>
                <Textarea
                  id="end-sms-body"
                  value={endSmsBody}
                  onChange={(e) => setEndSmsBody(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="end-email-body" className="text-xs">
                  Email body
                </Label>
                <Textarea
                  id="end-email-body"
                  value={endEmailBody}
                  onChange={(e) => setEndEmailBody(e.target.value)}
                  rows={4}
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
