import { redirect } from "next/navigation";
import { recordInviteLinkView } from "@/lib/reseller/invite-analytics";
import { resolveResellerInvite } from "@/lib/reseller/invite";

export default async function JoinResellerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const tenant = await resolveResellerInvite(code);
  if (!tenant) {
    redirect("/signup?error=invalid_invite");
  }

  await recordInviteLinkView(tenant.resellerId, "share");

  redirect(`/signup?r=${encodeURIComponent(code.trim())}&from=join`);
}
