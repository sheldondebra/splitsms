import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { getResellerClientsDashboard } from "@/lib/reseller/clients";
import { ensureResellerInviteCode, buildResellerShareSignupUrl } from "@/lib/reseller/invite";
import { getResellerInviteStats } from "@/lib/reseller/invite-analytics";
import { getSignupCountryOptions } from "@/lib/signup-countries";
import { getSiteUrl } from "@/lib/site-config";
import { ResellerClientsView } from "@/components/reseller/clients/reseller-clients-view";
import { redirect } from "next/navigation";

export default async function ResellerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [data, countries] = await Promise.all([
    getResellerClientsDashboard(reseller.id),
    getSignupCountryOptions(),
  ]);

  const loginBaseUrl = reseller.domain
    ? `https://${reseller.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
    : getSiteUrl();

  const inviteCode = await ensureResellerInviteCode(reseller.id);
  const signupStats = await getResellerInviteStats(reseller.id);

  return (
    <ResellerClientsView
      data={data}
      countries={countries}
      loginBaseUrl={loginBaseUrl}
      signupShareUrl={buildResellerShareSignupUrl(inviteCode)}
      signupStats={signupStats}
      brandName={reseller.brandName ?? reseller.businessName}
      flash={{
        created: params.created,
        error: params.error,
        saved: params.saved,
      }}
    />
  );
}
