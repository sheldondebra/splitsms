import { SiteHeader } from "@/components/layout/site-header";
import { getHeaderAccountProfile } from "@/lib/user/get-header-account-profile";

export async function SiteHeaderWithAccount() {
  const account = await getHeaderAccountProfile();
  return <SiteHeader account={account} />;
}
