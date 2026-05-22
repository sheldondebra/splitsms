import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { saveBrandingAction } from "@/lib/actions/reseller";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResellerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const brand = await prisma.whiteLabelBrand.findUnique({
    where: { resellerId: reseller.id },
  });

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">White-label settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Brand your reseller portal. Custom domains require DNS setup (future).
        </p>
      </div>
      {params.saved && <p className="text-sm text-green-600">Branding saved.</p>}

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Applied to your reseller dashboard sidebar and accents</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveBrandingAction} className="space-y-4">
            <div>
              <Label>Brand name</Label>
              <Input name="brandName" defaultValue={reseller.brandName ?? ""} />
            </div>
            <div>
              <Label>Custom domain (future)</Label>
              <Input name="domain" placeholder="sms.yourcompany.com" defaultValue={reseller.domain ?? ""} />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input name="logoUrl" defaultValue={brand?.logoUrl ?? ""} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary color</Label>
                <Input name="primaryColor" type="color" defaultValue={brand?.primaryColor ?? "#f97316"} />
              </div>
              <div>
                <Label>Sidebar color</Label>
                <Input
                  name="secondaryColor"
                  type="color"
                  defaultValue={brand?.secondaryColor ?? "#0f0f0f"}
                />
              </div>
            </div>
            <div>
              <Label>Support email</Label>
              <Input name="supportEmail" type="email" defaultValue={brand?.supportEmail ?? ""} />
            </div>
            <Button type="submit">Save branding</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
