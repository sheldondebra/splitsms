"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Lock,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import {
  setSubUserVerifiedAction,
  toggleSubUserSuspendAction,
} from "@/lib/actions/reseller";
import type { ResellerClientsDashboard } from "@/lib/reseller/clients";
import type { SignupCountryOption } from "@/lib/signup-countries";
import { ResellerClientsCharts } from "@/components/reseller/clients/reseller-clients-charts";
import { AddResellerClientDialog } from "@/components/reseller/clients/add-reseller-client-dialog";
import { ResellerSignupLinkCompact } from "@/components/reseller/reseller-signup-link-panel";
import type { ResellerInviteStats } from "@/lib/reseller/invite-analytics";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Client = ResellerClientsDashboard["clients"][number];

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ClientStatusBadges({ client }: { client: Client }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {client.isSuspended ? (
        <Badge variant="destructive">Suspended</Badge>
      ) : (
        <Badge variant="secondary">Active</Badge>
      )}
      {client.isVerified ? (
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
          Verified
        </Badge>
      ) : (
        <Badge variant="outline">Unverified</Badge>
      )}
      {client.credits < 50 ? (
        <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
          Low credits
        </Badge>
      ) : null}
      {client.lockedUntil && new Date(client.lockedUntil) > new Date() ? (
        <Badge variant="destructive">Locked</Badge>
      ) : null}
    </div>
  );
}

export function ResellerClientsView({
  data,
  countries,
  loginBaseUrl,
  signupShareUrl,
  signupStats,
  brandName,
  flash,
}: {
  data: ResellerClientsDashboard;
  countries: SignupCountryOption[];
  loginBaseUrl: string;
  signupShareUrl: string;
  signupStats: ResellerInviteStats;
  brandName?: string | null;
  flash?: { created?: string; error?: string; saved?: string };
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "unverified" | "low">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.clients.filter((client) => {
      if (filter === "active" && client.isSuspended) return false;
      if (filter === "suspended" && !client.isSuspended) return false;
      if (filter === "unverified" && client.isVerified) return false;
      if (filter === "low" && client.credits >= 50) return false;
      if (!q) return true;
      return (
        client.fullName.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        (client.email?.toLowerCase().includes(q) ?? false) ||
        String(client.accountNumber ?? "").includes(q)
      );
    });
  }, [data.clients, filter, query]);

  return (
    <ResellerPage className="max-w-7xl">
      <ResellerPageHeader
        title="Clients"
        description="Add clients, manage access, verify accounts, reset passwords, and monitor usage from one place."
        icon={Users}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/reseller/clients/export"
              download
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Download className="size-3.5" />
              Export CSV
            </a>
            <AddResellerClientDialog
              countries={countries}
              loginBaseUrl={loginBaseUrl}
              brandName={brandName}
            />
          </div>
        }
      />

      {flash?.created ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Client created successfully.
        </p>
      ) : null}
      {flash?.saved === "verified" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Client verified.
        </p>
      ) : null}
      {flash?.error === "exists" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          That phone number is already registered.
        </p>
      ) : null}
      {flash?.error === "email_exists" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          That email is already in use.
        </p>
      ) : null}
      {flash?.error === "invalid" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Name, phone, and an 8+ character password are required.
        </p>
      ) : null}

      <ResellerSignupLinkCompact shareUrl={signupShareUrl} stats={signupStats} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResellerStatCard label="Total clients" value={data.stats.total} accent />
        <ResellerStatCard
          label="Active"
          value={data.stats.active}
          hint={`${data.stats.suspended} suspended · ${data.stats.unverified} unverified`}
        />
        <ResellerStatCard
          label="Client credits"
          value={data.stats.totalCredits.toLocaleString()}
          hint={`${data.stats.lowCredit} low-credit accounts`}
        />
        <ResellerStatCard
          label="30d delivery"
          value={`${data.stats.deliveryRate}%`}
          hint={`${data.stats.totalMessages30d.toLocaleString()} messages · wallets ${money("GHS", data.stats.totalWallet)}`}
        />
      </div>

      <ResellerClientsCharts charts={data.charts} />

      <ResellerCard
        title={`Client directory (${filtered.length})`}
        description="Search, filter, suspend, verify, or open a full client profile."
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, email, account #"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["suspended", "Suspended"],
                ["unverified", "Unverified"],
                ["low", "Low credits"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No clients match this view</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use Add client above, or clear filters to see everyone.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="rounded-2xl border border-border/60 p-4 transition-colors hover:border-primary/25 hover:bg-muted/15"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/reseller/users/${client.id}`}
                        className="truncate text-base font-semibold hover:text-primary hover:underline"
                      >
                        {client.fullName}
                      </Link>
                      {client.accountNumber ? (
                        <span className="text-xs text-muted-foreground">#{client.accountNumber}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.phone}
                      {client.email ? ` · ${client.email}` : ""} · {client.countryCode}
                    </p>
                    <ClientStatusBadges client={client} />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <WalletCards className="h-3.5 w-3.5" />
                        {client.credits.toLocaleString()} credits · {money(client.walletCurrency, client.walletBalance)}
                      </span>
                      <span>{client.messages.toLocaleString()} messages</span>
                      <span>{client.apiKeys} API keys</span>
                      <span>{client.campaigns} campaigns</span>
                      {client.dailySmsLimit ? <span>Daily cap {client.dailySmsLimit}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!client.isVerified ? (
                      <form action={setSubUserVerifiedAction}>
                        <input type="hidden" name="subUserId" value={client.id} />
                        <input type="hidden" name="verified" value="1" />
                        <input type="hidden" name="returnTo" value="list" />
                        <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verify
                        </Button>
                      </form>
                    ) : null}
                    <form action={toggleSubUserSuspendAction}>
                      <input type="hidden" name="subUserId" value={client.id} />
                      <Button type="submit" size="sm" variant="outline">
                        {client.isSuspended ? "Activate" : "Suspend"}
                      </Button>
                    </form>
                    <Link href={`/reseller/users/${client.id}`}>
                      <Button size="sm" className="gap-1.5">
                        Manage
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {(client.credits < 50 || !client.isVerified || client.isSuspended) && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    {client.credits < 50 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Needs credit top-up
                      </span>
                    ) : null}
                    {!client.isVerified ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" />
                        Waiting for verification
                      </span>
                    ) : null}
                    {client.isSuspended ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Access blocked
                      </span>
                    ) : null}
                    {client.isVerified && !client.isSuspended && client.credits >= 50 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Healthy account
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ResellerCard>
    </ResellerPage>
  );
}
