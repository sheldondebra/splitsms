import Link from "next/link";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { getConnectDashboardData } from "@/lib/connect/dashboard";
import {
  Key,
  BadgeCheck,
  Puzzle,
  Users,
  Route,
  ArrowRight,
  Wallet,
  Code2,
  Link2,
} from "lucide-react";

export function ConnectHub({ data }: { data: Awaited<ReturnType<typeof getConnectDashboardData>> }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <AppCardBody className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Wallet className="h-4 w-4" />
              Wallet
            </div>
            <p className="text-2xl font-bold mt-1">
              {data.balance.walletCurrency} {data.balance.walletBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{data.balance.creditBalance} SMS credits</p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Key className="h-4 w-4" />
              API keys
            </div>
            <p className="text-2xl font-bold mt-1">{data.apiKeys.filter((k) => k.isActive).length}</p>
            <p className="text-xs text-muted-foreground">active connections</p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Users className="h-4 w-4" />
              Connect customers
            </div>
            <p className="text-2xl font-bold mt-1">{data.connectCustomerCount}</p>
            <p className="text-xs text-muted-foreground">provisioned via API</p>
          </AppCardBody>
        </AppCard>
        <AppCard>
          <AppCardBody className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              <Route className="h-4 w-4" />
              Routing
            </div>
            <p className="text-sm font-semibold mt-1">
              {data.policy.autoRouteByRecipient ? "Auto by number" : "Manual / legacy"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.policy.senderRegistrationMode.replace("_", " ").toLowerCase()} sender reg.
            </p>
          </AppCardBody>
        </AppCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Quick links
              </h2>
            </div>
            <div className="grid gap-2">
              {[
                { href: "/dashboard/api-keys", label: "API keys", icon: Key },
                { href: "/api-docs", label: "API reference", icon: Code2 },
                { href: "/dashboard/sender-ids", label: "Sender IDs", icon: BadgeCheck },
                { href: "/dashboard/integrations/google", label: "Google", icon: Link2 },
                { href: "/dashboard/integrations/wordpress", label: "WordPress", icon: Puzzle },
                { href: "/docs/connect", label: "Connect docs", icon: ArrowRight },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 space-y-3">
            <h2 className="font-semibold">Recent routing</h2>
            {data.recentRouting.length === 0 ? (
              <p className="text-sm text-muted-foreground">Send SMS to see provider switches here.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recentRouting.map((log) => (
                  <li key={log.id} className="rounded-lg border px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-mono text-xs">{log.recipient ?? "—"}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {log.selectedProvider ?? "—"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </AppCardBody>
        </AppCard>
      </div>

      {data.senderIds.length > 0 && (
        <AppCard>
          <AppCardBody className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">Sender IDs</h2>
              <Link href="/dashboard/sender-ids" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                Manage
              </Link>
            </div>
            <ul className="space-y-2">
              {data.senderIds.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-semibold">{s.value}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </AppCardBody>
        </AppCard>
      )}
    </div>
  );
}
