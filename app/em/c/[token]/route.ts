import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-config";
import {
  parseEmailMarketingTrackingToken,
  safeClickRedirect,
} from "@/lib/admin/email-marketing-track";
import {
  loadDeliveryForTracking,
  recordEmailMarketingEvent,
} from "@/lib/admin/email-marketing-events";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const target = safeClickRedirect(new URL(request.url).searchParams.get("u"));
  const fallback = getSiteUrl();
  const deliveryId = parseEmailMarketingTrackingToken(token);

  if (deliveryId && target) {
    const delivery = await loadDeliveryForTracking(deliveryId);
    if (delivery) {
      await recordEmailMarketingEvent({
        campaignId: delivery.campaignId,
        deliveryId: delivery.id,
        email: delivery.email,
        kind: "click",
        url: target,
      }).catch(() => null);
    }
  }

  return NextResponse.redirect(target || fallback, 302);
}
