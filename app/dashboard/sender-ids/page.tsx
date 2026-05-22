import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Info } from "lucide-react";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

async function requestSenderId(formData: FormData) {
  "use server";
  const { getSession } = await import("@/lib/auth/session");
  const { prisma } = await import("@/lib/db");
  const { redirect } = await import("next/navigation");
  const session = await getSession();
  if (!session) return;

  const value = String(formData.get("value") ?? "").trim().toUpperCase();
  if (!value || value.length > 11) {
    redirect("/dashboard/sender-ids?error=invalid");
  }

  await prisma.senderId.create({
    data: {
      userId: session.userId,
      value,
      countryCode: String(formData.get("countryCode") ?? "GH").toUpperCase(),
    },
  });
  redirect("/dashboard/sender-ids?requested=1");
}

const STATUS: Record<SenderIdStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  APPROVED: { label: "Active", variant: "default" },
  PENDING: { label: "Pending", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export default async function SenderIdsPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const senderIds = await prisma.senderId.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const approved = senderIds.filter((s) => s.status === "APPROVED");

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sender ID</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              The name displayed when recipients receive your SMS
            </p>
          </div>
        </div>
      </div>

      {params.requested && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          Request submitted. We will notify you when your Sender ID is approved.
        </p>
      )}
      {params.error && (
        <p className="text-sm text-destructive rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          Enter a valid Sender ID (up to 11 characters, letters and numbers).
        </p>
      )}

      <div className="rounded-2xl border bg-muted/30 px-4 py-3 flex gap-3 text-sm text-muted-foreground">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <p>
          Examples: <strong className="text-foreground">MYBRAND</strong>,{" "}
          <strong className="text-foreground">ACMEGH</strong>. Must be approved before you can send bulk SMS.
        </p>
      </div>

      {approved.length > 0 && (
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Sender ID</CardTitle>
            <CardDescription>Used by default when you send messages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono tracking-wide">
              {approved.find((s) => s.isDefault)?.value ?? approved[0].value}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Request a new Sender ID</CardTitle>
          <CardDescription>Usually approved within 1–2 business days</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={requestSenderId} className="space-y-4">
            <div>
              <Label htmlFor="value" className="text-sm font-semibold">
                Sender ID name
              </Label>
              <Input
                id="value"
                name="value"
                maxLength={11}
                required
                placeholder="MYBRAND"
                className="mt-1.5 h-12 text-base font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 11 characters</p>
            </div>
            <div>
              <Label htmlFor="countryCode">Country</Label>
              <Input
                id="countryCode"
                name="countryCode"
                defaultValue="GH"
                className="mt-1.5 h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full sm:w-auto font-semibold">
              Submit request
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your Sender IDs</CardTitle>
        </CardHeader>
        <CardContent>
          {senderIds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No Sender IDs yet. Submit a request above to get started.
            </p>
          ) : (
            <ul className="divide-y">
              {senderIds.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-4 first:pt-0">
                  <div>
                    <p className="font-mono font-semibold text-lg">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.countryCode}</p>
                  </div>
                  <Badge variant={STATUS[s.status].variant}>{STATUS[s.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
