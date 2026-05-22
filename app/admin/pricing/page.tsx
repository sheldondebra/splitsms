import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPricingPage() {
  const pricing = await prisma.smsPricing.findMany({ include: { country: true } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS pricing</h1>
      <Card>
        <CardContent className="divide-y pt-6">
          {pricing.map((p) => (
            <div key={p.id} className="flex justify-between py-3 text-sm">
              <span>{p.country.name}</span>
              <span>{p.memberPrice.toString()} / SMS ({p.creditsPerSms} credit)</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
