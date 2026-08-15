import Link from "next/link";
import { format } from "date-fns";
import { getProviderBalanceHistory } from "@/lib/sms/provider-balance-history";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { History, ArrowLeft, Radio, Cloud, Globe } from "lucide-react";

const PROVIDERS: { type: SmsProviderType | "all"; label: string }[] = [
  { type: "all", label: "All" },
  { type: "MNOTIFY", label: "mNotify" },
  { type: "TWILIO", label: "Twilio" },
  { type: "INFOBIP", label: "Infobip" },
];

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual check",
  "refresh-all": "Refresh all",
  "system-sync": "System sync",
  "alert-check": "Alert check",
};

function providerIcon(type: SmsProviderType) {
  if (type === "MNOTIFY") return Radio;
  if (type === "TWILIO") return Cloud;
  return Globe;
}

function parseProvider(value: string | undefined): SmsProviderType | "all" {
  if (value === "MNOTIFY" || value === "TWILIO" || value === "INFOBIP") return value;
  return "all";
}

export default async function AdminBalancesPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const params = await searchParams;
  const provider = parseProvider(params.provider);
  const history = await getProviderBalanceHistory({ type: provider, limit: 150 });

  const latestByType = new Map<SmsProviderType, (typeof history)[number]>();
  for (const entry of history) {
    if (!latestByType.has(entry.type)) latestByType.set(entry.type, entry);
  }

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Balance history"
        description="Snapshots from manual checks, refresh all, and system sync."
        icon={History}
        actions={
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {(["MNOTIFY", "TWILIO", "INFOBIP"] as const).map((type) => {
          const latest = latestByType.get(type);
          const Icon = providerIcon(type);
          return (
            <AdminStatCard
              key={type}
              label={type === "MNOTIFY" ? "mNotify" : type === "TWILIO" ? "Twilio" : "Infobip"}
              value={latest?.display ?? "—"}
              hint={
                latest
                  ? `Last check ${format(new Date(latest.at), "MMM d, HH:mm")}`
                  : "No checks recorded yet"
              }
              icon={Icon}
              variant={latest?.status === "ok" ? "primary" : "default"}
              href={`/admin/balances?provider=${type}`}
            />
          );
        })}
      </div>

      <AdminCard
        title="Check log"
        description={
          history.length === 0
            ? "Refresh a provider balance on the dashboard to start the history"
            : `${history.length} recent snapshot${history.length === 1 ? "" : "s"}`
        }
        dense
        actions={
          <div className="flex flex-wrap gap-1.5">
            {PROVIDERS.map((p) => (
              <Link
                key={p.type}
                href={p.type === "all" ? "/admin/balances" : `/admin/balances?provider=${p.type}`}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  provider === p.type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      >
        {history.length === 0 ? (
          <AdminEmpty dense>
            No balance history yet. Open the dashboard and click a provider’s refresh button.
          </AdminEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">When</th>
                  <th className="pb-2 pr-3 font-semibold">Provider</th>
                  <th className="pb-2 pr-3 font-semibold">Balance</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {history.map((entry) => {
                  const Icon = providerIcon(entry.type);
                  return (
                    <tr key={entry.id} className="align-top">
                      <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                        {format(new Date(entry.at), "MMM d, yyyy · HH:mm:ss")}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{entry.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold tabular-nums">{entry.display}</p>
                        {entry.error ? (
                          <p className="mt-0.5 text-[11px] text-destructive line-clamp-2">{entry.error}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            entry.status === "ok" && "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
                            entry.status === "error" && "border-amber-500/40 text-amber-800 dark:text-amber-200",
                          )}
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {SOURCE_LABEL[entry.source] ?? entry.source}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
