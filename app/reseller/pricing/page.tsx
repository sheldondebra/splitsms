import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { setResellerPricingAction } from "@/lib/actions/reseller";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResellerPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [platformPricing, resellerPricing] = await Promise.all([
    prisma.smsPricing.findMany({ include: { country: true }, where: { isActive: true } }),
    prisma.resellerCountryPricing.findMany({ where: { resellerId: reseller.id } }),
  ]);

  const byCode = Object.fromEntries(resellerPricing.map((r) => [r.countryCode, r]));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Reseller pricing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set sell prices for your sub-users. Your margin = sell price − platform cost.
        </p>
      </div>
      {params.saved && <p className="text-sm text-green-600">Pricing saved.</p>}

      <div className="space-y-4">
        {platformPricing.map((p) => {
          const custom = byCode[p.country.code];
          const platformCost = p.costPrice.toNumber();
          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.country.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Platform cost: {p.currency} {platformCost} / segment
                </p>
              </CardHeader>
              <CardContent>
                <form action={setResellerPricingAction} className="flex flex-wrap gap-3 items-end">
                  <input type="hidden" name="countryCode" value={p.country.code} />
                  <div>
                    <Label>Your sell price</Label>
                    <Input
                      name="sellPrice"
                      type="number"
                      step="0.0001"
                      defaultValue={custom?.sellPrice.toString() ?? String(platformCost * 1.4)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input name="currency" defaultValue={custom?.currency ?? p.currency} />
                  </div>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
