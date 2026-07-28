import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getOrCreateResellerPaymentSettings, maskSecret } from "@/lib/reseller/payment-settings";
import { buildResellerSignupLinks } from "@/lib/reseller/invite";
import { prisma } from "@/lib/db";
import { ResellerSettingsView } from "@/components/reseller/settings/reseller-settings-view";
import { redirect } from "next/navigation";

export default async function ResellerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; tab?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [brand, payments] = await Promise.all([
    prisma.whiteLabelBrand.findUnique({ where: { resellerId: reseller.id } }),
    getOrCreateResellerPaymentSettings(reseller.id),
  ]);

  const signupLinks = await buildResellerSignupLinks({
    resellerId: reseller.id,
    domain: reseller.domain,
  });

  return (
    <ResellerSettingsView
      initialTab={params.tab}
      flash={{ saved: params.saved, error: params.error }}
      data={{
        brandName: reseller.brandName ?? reseller.businessName,
        domain: reseller.domain,
        signupShareUrl: signupLinks.shareUrl,
        signupDomainUrl: signupLinks.domainUrl,
        signupStats: signupLinks.stats,
        branding: {
          logoUrl: brand?.logoUrl ?? null,
          primaryColor: brand?.primaryColor ?? "#f97316",
          secondaryColor: brand?.secondaryColor ?? "#0f0f0f",
          accentColor: brand?.accentColor ?? null,
          supportEmail: brand?.supportEmail ?? null,
        },
        payments: {
          checkoutMode: payments.checkoutMode,
          paystackEnabled: payments.paystackEnabled,
          paystackPublicKey: payments.paystackPublicKey ?? "",
          paystackSecretMasked: maskSecret(payments.paystackSecretKey),
          stripeEnabled: payments.stripeEnabled,
          stripePublishableKey: payments.stripePublishableKey ?? "",
          stripeSecretMasked: maskSecret(payments.stripeSecretKey),
          payoutMethod: payments.payoutMethod,
          payoutPhone: payments.payoutPhone ?? "",
          payoutAccountName: payments.payoutAccountName ?? "",
          payoutBankName: payments.payoutBankName ?? "",
          payoutAccountNumber: payments.payoutAccountNumber ?? "",
          payoutNotes: payments.payoutNotes ?? "",
        },
      }}
    />
  );
}
