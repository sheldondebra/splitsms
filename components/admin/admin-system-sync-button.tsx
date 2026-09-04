"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminSystemSyncStateAction,
  type AdminSystemSyncState,
} from "@/lib/actions/admin-operations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2, RefreshCw, XCircle } from "lucide-react";

const SYNC_STEPS = [
  "Resuming due paused campaigns",
  "Starting scheduled campaigns",
  "Sending pending SMS",
  "Syncing delivery reports",
  "Checking provider balances",
  "Refreshing campaign statuses",
  "Checking sender ID registrations",
  "Checking system alerts",
];

const INITIAL_STATE: AdminSystemSyncState = {
  status: "idle",
  message: "",
  tasks: [],
};

export function AdminSystemSyncButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, formAction, pending] = useActionState(
    adminSystemSyncStateAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (!pending) return;

    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, SYNC_STEPS.length - 1));
    }, 1300);

    return () => window.clearInterval(timer);
  }, [pending]);

  useEffect(() => {
    if (state.status === "idle" || !state.submittedAt) return;

    const failed = state.tasks.filter((task) => !task.ok);
    const toastFn = failed.length > 0 ? toast.error : toast.success;

    toastFn(state.message, {
      duration: 12000,
      action:
        pathname === "/admin/system-sync"
          ? undefined
          : {
              label: "View details",
              onClick: () => router.push("/admin/system-sync"),
            },
      description: (
        <div className="mt-2 space-y-1.5">
          {state.tasks.map((task) => {
            const Icon = task.ok ? CheckCircle2 : XCircle;
            return (
              <div key={task.id} className="flex items-start gap-2 text-xs">
                <Icon
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    task.ok ? "text-emerald-600" : "text-destructive",
                  )}
                />
                <div>
                  <p className="font-medium text-foreground">{task.label}</p>
                  <p className="text-muted-foreground">{task.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      ),
    });
  }, [state, pathname, router]);

  return (
    <form action={formAction} className="relative">
      <input type="hidden" name="returnTo" value={pathname || "/admin"} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="hidden lg:inline-flex h-9 gap-1.5"
        disabled={pending}
        title="Run full system sync (SMS, delivery, balances, sender ID carriers)"
        onClick={() => setStepIndex(0)}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {pending ? SYNC_STEPS[stepIndex] : "System sync"}
      </Button>

      {pending && (
        <div
          className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border/70 bg-popover p-3 text-popover-foreground shadow-xl"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div>
              <p className="text-xs font-semibold">System sync running</p>
              <p className="text-[11px] text-muted-foreground">{SYNC_STEPS[stepIndex]}</p>
            </div>
          </div>
          <ul className="mt-2 space-y-1.5">
            {SYNC_STEPS.map((step, index) => {
              const complete = index < stepIndex;
              const active = index === stepIndex;
              return (
                <li key={step} className="flex items-center gap-2 text-[11px]">
                  {active ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                  <span
                    className={cn(
                      active && "font-semibold text-foreground",
                      !active && "text-muted-foreground",
                    )}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </form>
  );
}
