"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { sendAdminSmsTestAction } from "@/lib/actions/admin-sms-test";
import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminSmsTestEntry } from "@/lib/admin/sms-test-history";

const DEFAULT_MESSAGE =
  "This is a test message from SplitSMS. If you received this, delivery is working correctly.";

function statusBadge(status: string) {
  const tone =
    status === "DELIVERED"
      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
      : status === "FAILED" || status === "REJECTED" || status === "EXPIRED"
        ? "border-destructive/40 text-destructive"
        : status === "SENT" || status === "PROCESSING"
          ? "border-amber-500/40 text-amber-800 dark:text-amber-200"
          : "text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("text-[10px]", tone)}>
      {status}
    </Badge>
  );
}

export function GeneralSmsTestPanel({
  senderIds,
  history,
}: {
  senderIds: string[];
  history: AdminSmsTestEntry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [numbers, setNumbers] = useState("");
  const [senderId, setSenderId] = useState(senderIds[0] ?? "");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  function runSend() {
    startTransition(async () => {
      const result = await sendAdminSmsTestAction({ numbers, senderId, message });
      if (result.ok) {
        toast.success(result.message);
        setNumbers("");
      } else {
        toast.error(result.message);
      }
      router.refresh();
    });
  }

  async function refreshDelivery() {
    setRefreshing(true);
    try {
      await fetch("/api/dashboard/delivery-sync", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Send a test SMS"
        description="Sends a real message through the live provider pipeline — no wallet credit is deducted."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sms-test-numbers">
              Phone numbers
            </label>
            <Textarea
              id="sms-test-numbers"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              rows={3}
              placeholder={"233201234567\n233559876543 (one per line, or comma-separated — max 20)"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="sms-test-sender">
                Sender ID
              </label>
              {senderIds.length > 0 ? (
                <select
                  id="sms-test-sender"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                >
                  {senderIds.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-destructive">No approved sender IDs on the platform yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="sms-test-message">
              Message
            </label>
            <Textarea
              id="sms-test-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={runSend}
            disabled={pending || senderIds.length === 0 || !numbers.trim()}
            className="gap-1.5"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? "Sending…" : "Send test"}
          </Button>
        </div>
      </AdminCard>

      <AdminCard
        title="Test history"
        description={`${history.length} recent test send${history.length === 1 ? "" : "s"}`}
        dense
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshDelivery()} disabled={refreshing} className="gap-1.5">
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh delivery
          </Button>
        }
      >
        {history.length === 0 ? (
          <AdminEmpty dense>No test messages sent yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">Recipient</th>
                  <th className="pb-2 pr-3 font-semibold">Provider</th>
                  <th className="pb-2 pr-3 font-semibold">Credit</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 pr-3 font-semibold">Sent</th>
                  <th className="pb-2 pr-3 font-semibold">Delivered</th>
                  <th className="pb-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-3 font-mono text-xs">+{entry.recipient}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {entry.providerType ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs tabular-nums">
                      {entry.cost != null ? `${entry.cost.toFixed(4)} (${entry.smsUnits}u)` : "—"}
                    </td>
                    <td className="py-3 pr-3">{statusBadge(entry.status)}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.sentAt ? format(entry.sentAt, "MMM d, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.deliveredAt ? format(entry.deliveredAt, "MMM d, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground max-w-[220px] truncate" title={entry.failureReason ?? entry.providerRef ?? undefined}>
                      {entry.failureReason ?? entry.providerRef ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

