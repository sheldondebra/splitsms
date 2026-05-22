import { updateCountryPricingAction, setUserCustomPricingAction } from "@/lib/actions/pricing";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default async function AdminPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; userPricing?: string }>;
}) {
  const params = await searchParams;
  const pricing = await prisma.smsPricing.findMany({
    include: { country: true },
    orderBy: { country: { name: "asc" } },
  });

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    take: 20,
    select: { id: true, fullName: true, phone: true },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">SMS pricing</h1>
      {params.saved && <p className="text-sm text-green-600">Pricing saved.</p>}

      <Card>
        <CardHeader>
          <CardTitle>Country rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {pricing.map((p) => {
            const profit = p.memberPrice.toNumber() - p.costPrice.toNumber();
            return (
              <form
                key={p.id}
                action={updateCountryPricingAction}
                className="grid gap-4 border-b pb-6 last:border-0 sm:grid-cols-6 items-end"
              >
                <input type="hidden" name="id" value={p.id} />
                <div className="sm:col-span-2">
                  <p className="font-medium">{p.country.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Profit: {profit.toFixed(4)} {p.currency}
                  </p>
                </div>
                <div>
                  <Label>Cost</Label>
                  <Input name="costPrice" type="number" step="0.0001" defaultValue={p.costPrice.toString()} />
                </div>
                <div>
                  <Label>Sell</Label>
                  <Input name="memberPrice" type="number" step="0.0001" defaultValue={p.memberPrice.toString()} />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input name="provider" defaultValue={p.provider} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={p.isActive} />
                    Active
                  </label>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </div>
              </form>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom user pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={setUserCustomPricingAction} className="grid gap-4 sm:grid-cols-2 max-w-xl">
            <div>
              <Label>Member</Label>
              <select name="userId" className="flex h-10 w-full rounded-md border px-3 text-sm" required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Country code</Label>
              <Input name="countryCode" defaultValue="GH" required />
            </div>
            <div>
              <Label>Sell price</Label>
              <Input name="sellPrice" type="number" step="0.0001" required />
            </div>
            <div>
              <Label>Currency</Label>
              <Input name="currency" defaultValue="GHS" />
            </div>
            <Button type="submit">Set custom rate</Button>
          </form>
          {params.userPricing && <Badge className="mt-4">Custom pricing saved</Badge>}
        </CardContent>
      </Card>
    </div>
  );
}
