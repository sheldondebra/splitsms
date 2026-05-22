import { setUserCustomPricingAction } from "@/lib/actions/pricing";
import { listAllPricingForAdmin } from "@/lib/billing/pricing";
import { prisma } from "@/lib/db";
import { AdminPricingTable, type AdminPricingRow } from "@/components/admin/admin-pricing-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminAlert,
  AdminCard,
} from "@/components/admin/admin-page-shell";
import { DollarSign, ExternalLink, Users } from "lucide-react";

export default async function AdminPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; userPricing?: string }>;
}) {
  const params = await searchParams;
  const pricing = await listAllPricingForAdmin();

  const tableRows: AdminPricingRow[] = pricing.map((p) => ({
    id: p.id,
    countryCode: p.country.code,
    countryName: p.country.name,
    dialCode: p.country.dialCode,
    memberPrice: p.memberPrice.toString(),
    costPrice: p.costPrice.toString(),
    creditsPerSms: p.creditsPerSms,
    currency: p.currency,
    provider: p.provider,
    isActive: p.isActive,
  }));

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    take: 30,
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, phone: true },
  });

  const activePublic = tableRows.filter((r) => r.isActive).length;

  const customCount = await prisma.userSmsPricing.count({ where: { isActive: true } });

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="SMS pricing"
        description="Set sell price, cost, credits, and currency per country. Active rates appear on the public pricing page."
        icon={DollarSign}
        actions={
          <Link
            href="/pricing"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted/50"
          >
            Preview public page
            <ExternalLink className="h-4 w-4" />
          </Link>
        }
      />

      {params.saved && (
        <AdminAlert variant="success">
          Country pricing saved. Public <code className="text-xs bg-muted px-1 rounded">/pricing</code>{" "}
          page updated.
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Countries" value={tableRows.length} />
        <AdminStatCard label="Live on website" value={activePublic} variant="primary" />
        <AdminStatCard label="Custom member rates" value={customCount} />
      </div>

      <AdminCard
        title="Country rates"
        description="Sell = public price per segment. Uncheck Active to hide from /pricing."
      >
        <AdminPricingTable rows={tableRows} />
      </AdminCard>

      <AdminCard
        title="Custom member pricing"
        description="Override public rates for a specific account (dashboard only)."
      >
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          Per-user overrides
        </div>
        <div>
          <form
            action={setUserCustomPricingAction}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-3xl"
          >
            <div className="sm:col-span-2">
              <Label>Member</Label>
              <select
                name="userId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1.5"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Country code</Label>
              <Input name="countryCode" defaultValue="GH" required className="mt-1.5" />
            </div>
            <div>
              <Label>Sell price</Label>
              <Input name="sellPrice" type="number" step="0.0001" required className="mt-1.5" />
            </div>
            <div>
              <Label>Currency</Label>
              <Input name="currency" defaultValue="GHS" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit">Set custom rate</Button>
              {params.userPricing && (
                <Badge className="ml-3">Custom pricing saved</Badge>
              )}
            </div>
          </form>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
