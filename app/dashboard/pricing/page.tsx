import { listPublicPricing } from "@/lib/billing/pricing";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign } from "lucide-react";

export default async function DashboardPricingPage() {
  const session = await getSession();
  if (!session) return null;

  const [pricing, custom] = await Promise.all([
    listPublicPricing(),
    prisma.userSmsPricing.findMany({
      where: { userId: session.userId, isActive: true },
    }),
  ]);

  const customByCode = Object.fromEntries(custom.map((c) => [c.countryCode, c]));

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-primary" />
          SMS pricing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Per-segment rates by country. Unicode messages use more segments.
        </p>
      </div>

      {custom.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Your custom rates</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {custom.map((c) => (
              <p key={c.id}>
                {c.countryCode}: {c.currency} {c.sellPrice.toString()} / segment
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Country rates</CardTitle>
          <CardDescription>
            Minimum balance recommended: 10 SMS credits. Approved sender ID required for delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Sell price</TableHead>
                <TableHead>Credits/SMS</TableHead>
                <TableHead>Currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.map((p) => {
                const override = customByCode[p.country.code];
                const sell = override?.sellPrice ?? p.memberPrice;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.country.name}
                      {override && (
                        <Badge className="ml-2" variant="secondary">
                          Custom
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.provider}</TableCell>
                    <TableCell className="font-mono">{sell.toString()}</TableCell>
                    <TableCell>{p.creditsPerSms}</TableCell>
                    <TableCell>{p.currency}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
