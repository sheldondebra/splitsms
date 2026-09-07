import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeliverySpeedStats } from "@/lib/sms/delivery-speed-stats";
import type { DeliverySpeedByBatch } from "@/lib/admin/delivery-speed";
import { Gauge, Send, Zap } from "lucide-react";

function speedTone(seconds: number): "ok" | "warn" | "danger" {
  if (seconds <= 15) return "ok";
  if (seconds <= 60) return "warn";
  return "danger";
}

function toneClass(tone: "ok" | "warn" | "danger") {
  if (tone === "ok") return "text-emerald-700 dark:text-emerald-300";
  if (tone === "warn") return "text-amber-800 dark:text-amber-200";
  return "text-destructive";
}

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${mins}m ${rest}s`;
}

function SpeedTile({ label, seconds }: { label: string; seconds: number }) {
  const tone = speedTone(seconds);
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", toneClass(tone))}>
        {formatSeconds(seconds)}
      </p>
    </div>
  );
}

export function AdminDeliverySpeedView({
  recent,
  batch,
}: {
  recent: DeliverySpeedStats | null;
  batch: DeliverySpeedByBatch;
}) {
  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Delivery speed"
        description="How long it takes SMS to reach carriers as DELIVERED after we send them — from sentAt to the delivery report, not queue time."
        icon={Gauge}
        actions={
          <Link
            href="/admin/messages"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/60 px-3 text-sm font-medium hover:bg-muted/40"
          >
            <Send className="h-3.5 w-3.5" />
            SMS logs
          </Link>
        }
      />

      <AdminCard
        title="Right now"
        description={
          recent
            ? `Based on the last ${recent.sampleSize} delivered message${recent.sampleSize === 1 ? "" : "s"}, platform-wide.`
            : "No recent deliveries with both send and delivery timestamps yet."
        }
      >
        {recent ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <SpeedTile label="Average" seconds={recent.avgSec} />
            <SpeedTile label="Fastest" seconds={recent.minSec} />
            <SpeedTile label="Slowest" seconds={recent.maxSec} />
          </div>
        ) : (
          <AdminEmpty>No delivered messages yet.</AdminEmpty>
        )}
      </AdminCard>

      <AdminCard
        title="By campaign"
        description={`Batches sent as a campaign in the last ${batch.windowDays} days, fastest info first.`}
      >
        {batch.campaigns.length === 0 ? (
          <AdminEmpty>No campaign deliveries in this window yet.</AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2.5 pr-2 font-semibold">Campaign</th>
                  <th className="pb-2.5 px-2 font-semibold">Sender ID</th>
                  <th className="pb-2.5 px-2 font-semibold text-right">Delivered</th>
                  <th className="pb-2.5 px-2 font-semibold text-right">Avg</th>
                  <th className="pb-2.5 px-2 font-semibold text-right">Fastest</th>
                  <th className="pb-2.5 px-2 font-semibold text-right">Slowest</th>
                  <th className="pb-2.5 pl-2 font-semibold text-right">Last delivered</th>
                </tr>
              </thead>
              <tbody>
                {batch.campaigns.map((c) => {
                  const tone = speedTone(c.stats.avgSec);
                  return (
                    <tr key={c.campaignId} className="hover:bg-muted/30">
                      <td className="border-t border-border/50 py-3 pr-2 align-middle min-w-0">
                        <Link
                          href={`/admin/messages?campaign=${c.campaignId}`}
                          className="font-medium hover:text-primary truncate block max-w-[220px]"
                          title={c.campaignName}
                        >
                          {c.campaignName}
                        </Link>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {c.campaignStatus}
                        </Badge>
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle font-mono text-xs">
                        {c.senderId ?? "—"}
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle text-right tabular-nums">
                        {c.stats.sampleSize.toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          "border-t border-border/50 px-2 py-3 align-middle text-right font-semibold tabular-nums",
                          toneClass(tone),
                        )}
                      >
                        {formatSeconds(c.stats.avgSec)}
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle text-right tabular-nums text-muted-foreground">
                        {formatSeconds(c.stats.minSec)}
                      </td>
                      <td className="border-t border-border/50 px-2 py-3 align-middle text-right tabular-nums text-muted-foreground">
                        {formatSeconds(c.stats.maxSec)}
                      </td>
                      <td className="border-t border-border/50 py-3 pl-2 align-middle text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(c.lastDeliveredAt), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Direct sends"
        description="Recent deliveries not tied to a campaign (API, OTP, SmartForms, single sends)."
      >
        {batch.direct.length === 0 ? (
          <AdminEmpty>No direct deliveries yet.</AdminEmpty>
        ) : (
          <ul className="space-y-2">
            {batch.direct.map((m) => {
              const tone = speedTone(m.seconds);
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <Zap className={cn("h-3.5 w-3.5 shrink-0", toneClass(tone))} />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium truncate">{m.recipient}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                        {m.senderId} · {formatDistanceToNow(new Date(m.deliveredAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <span className={cn("shrink-0 font-semibold tabular-nums text-sm", toneClass(tone))}>
                    {formatSeconds(m.seconds)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </AdminPage>
  );
}
