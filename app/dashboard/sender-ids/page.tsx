import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SenderIdRequestForm } from "@/components/dashboard/sender-id-request-form";
import { SenderIdList, type SenderIdItem } from "@/components/dashboard/sender-id-list";
import { SenderIdPendingPoller } from "@/components/dashboard/sender-id-pending-poller";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  BadgeCheck,
  Info,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";

const ALERTS: Record<string, { text: string; variant: "success" | "error" | "info" }> = {
  requested: {
    text: "Sender ID registered. Status is pending — you'll see a yellow loader until it's approved.",
    variant: "success",
  },
  default: {
    text: "Default Sender ID updated for new messages.",
    variant: "success",
  },
  invalid: {
    text: "Enter a valid Sender ID (1–11 characters, letters and numbers only).",
    variant: "error",
  },
  duplicate: {
    text: "You already registered this Sender ID.",
    variant: "error",
  },
  notfound: {
    text: "Sender ID not found or not approved yet.",
    variant: "error",
  },
};

export default async function SenderIdsPage({
  searchParams,
}: {
  searchParams: Promise<{
    requested?: string;
    default?: string;
    error?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const senderIds = await prisma.senderId.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const items: SenderIdItem[] = senderIds.map((s) => ({
    id: s.id,
    value: s.value,
    countryCode: s.countryCode,
    status: s.status,
    isDefault: s.isDefault,
    adminNote: s.adminNote,
    createdAt: s.createdAt.toISOString(),
  }));

  const approved = items.filter((s) => s.status === "APPROVED");
  const pending = items.filter((s) => s.status === "PENDING");
  const rejected = items.filter((s) => s.status === "REJECTED");
  const defaultId = approved.find((s) => s.isDefault) ?? approved[0];

  const alertKey = params.requested
    ? "requested"
    : params.default
      ? "default"
      : params.error ?? null;
  const alert = alertKey ? ALERTS[alertKey] : null;

  return (
    <AppPage medium>
      <PageHeader
        title="Sender ID"
        description="The name recipients see on their phone. Each registration is reviewed as pending, then approved or denied."
        icon={BadgeCheck}
        mobileDescription="Brand name shown on SMS — pending until approved."
        actions={
          <Link
            href="/dashboard/send"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-primary md:h-10"
          >
            Send SMS →
          </Link>
        }
      />

      {alert && (
        <div
          className={
            alert.variant === "success"
              ? "flex gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
              : alert.variant === "error"
                ? "flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                : "flex gap-3 rounded-2xl border px-4 py-3 text-sm"
          }
        >
          {alert.variant === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          {alert.text}
        </div>
      )}

      <SenderIdPendingPoller enabled={pending.length > 0} />

      {/* Status legend */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 flex items-center gap-2 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="font-medium text-amber-900 dark:text-amber-100">Pending</span>
          <span className="text-muted-foreground hidden sm:inline">— under review</span>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-emerald-800 dark:text-emerald-200">Approved</span>
          <span className="text-muted-foreground hidden sm:inline">— ready to send</span>
        </div>
        <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2.5 flex items-center gap-2 text-xs">
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
          <span className="font-medium">Denied</span>
          <span className="text-muted-foreground hidden sm:inline">— try another name</span>
        </div>
      </div>

      {defaultId && (
        <AppCard className="border-primary/25 bg-gradient-to-br from-primary/8 to-card">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active default
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-wide text-primary">
              {defaultId.value}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Used when you send SMS · {defaultId.countryCode}
            </p>
          </CardContent>
        </AppCard>
      )}

      <AppCard>
        <CardHeader>
          <CardTitle className="text-lg">Your registrations</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "No Sender IDs yet"
              : `${approved.length} approved · ${pending.length} pending · ${rejected.length} denied`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="No Sender ID yet"
              description="Register your brand name below. It will show as pending until our team approves it."
            />
          ) : (
            <SenderIdList items={items} />
          )}
        </CardContent>
      </AppCard>

      <AppCard>
        <CardHeader>
          <CardTitle className="text-lg">Register new Sender ID</CardTitle>
          <CardDescription>
            After you submit, status will show as pending with a yellow loading indicator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 px-4 py-3 flex gap-3 text-sm text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div>
              <p>
                Examples: <strong className="text-foreground font-mono">MYBRAND</strong>,{" "}
                <strong className="text-foreground font-mono">ACMEGH</strong>
              </p>
              <p className="mt-1 text-xs">
                Must be approved before bulk SMS. You cannot send with a pending or denied ID.
              </p>
            </div>
          </div>
          <SenderIdRequestForm />
        </CardContent>
      </AppCard>

      <div className="rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <Copy className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Need help? Approved IDs can be set as default. Denied IDs may include a reason from
          support — register a different name if denied.
        </p>
      </div>
    </AppPage>
  );
}
