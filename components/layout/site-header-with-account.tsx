import { SiteHeader } from "@/components/layout/site-header";
import { SmartFormsPromoPopup } from "@/components/marketing/smart-forms-promo-popup-lazy";
import { getHeaderAccountProfile } from "@/lib/user/get-header-account-profile";

export async function SiteHeaderWithAccount() {
  const account = await getHeaderAccountProfile();
  return (
    <>
      <SiteHeader account={account} />
      <SmartFormsPromoPopup />
    </>
  );
}
