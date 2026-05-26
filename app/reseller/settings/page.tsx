import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { saveBrandingAction } from "@/lib/actions/reseller";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  ResellerPage,
  ResellerPageHeader,
  ResellerCard,
} from "@/components/reseller/reseller-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { TenantDnsGuide } from "@/components/tenant/tenant-dns-guide";

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
    <ResellerPage className="max-w-2xl">
      <ResellerPageHeader
        title="White-label branding"
        description="Customize your portal and member login. Use a custom domain so sub-users sign in on your brand."
        icon={Palette}
      />
      {params.saved && (
        <p className="text-sm text-emerald-600 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
          Branding saved.
        </p>
      )}

      <ResellerCard>
        <form action={saveBrandingAction} className="space-y-5">
          <div className="space-y-2">
            <Label>Brand name (sidebar)</Label>
            <Input name="brandName" defaultValue={reseller.brandName ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>Custom domain</Label>
            <Input
              name="domain"
              placeholder="sms.yourcompany.com"
              defaultValue={reseller.domain ?? ""}
            />
          </div>
          <TenantDnsGuide domain={reseller.domain} />
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input name="logoUrl" defaultValue={brand?.logoUrl ?? ""} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary accent</Label>
              <Input
                name="primaryColor"
                type="color"
                defaultValue={brand?.primaryColor ?? "#f97316"}
                className="h-10 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Sidebar background</Label>
              <Input
                name="secondaryColor"
                type="color"
                defaultValue={brand?.secondaryColor ?? "#0f0f0f"}
                className="h-10 w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Support email</Label>
            <Input
              name="supportEmail"
              type="email"
              defaultValue={brand?.supportEmail ?? ""}
              placeholder="support@yourbrand.com"
            />
          </div>
          <Button type="submit">Save branding</Button>
        </form>
      </ResellerCard>
    </ResellerPage>
  );
}
