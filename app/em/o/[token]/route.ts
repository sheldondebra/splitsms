import { NextResponse } from "next/server";
import {
  EMAIL_OPEN_PIXEL_GIF,
  parseEmailMarketingTrackingToken,
} from "@/lib/admin/email-marketing-track";
import {
  loadDeliveryForTracking,
  recordEmailMarketingEvent,
} from "@/lib/admin/email-marketing-events";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const deliveryId = parseEmailMarketingTrackingToken(token);
  if (deliveryId) {
    const delivery = await loadDeliveryForTracking(deliveryId);
    if (delivery) {
      await recordEmailMarketingEvent({
        campaignId: delivery.campaignId,
        deliveryId: delivery.id,
        email: delivery.email,
        kind: "open",
      }).catch(() => null);
    }
  }

  return new NextResponse(EMAIL_OPEN_PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}
