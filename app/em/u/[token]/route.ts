import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-config";
import { parseEmailMarketingTrackingToken } from "@/lib/admin/email-marketing-track";
import {
  loadDeliveryForTracking,
  recordEmailMarketingEvent,
  suppressMarketingEmail,
} from "@/lib/admin/email-marketing-events";

export const dynamic = "force-dynamic";

async function processUnsubscribe(token: string) {
  const deliveryId = parseEmailMarketingTrackingToken(token);
  if (!deliveryId) return false;
  const delivery = await loadDeliveryForTracking(deliveryId);
  if (!delivery) return false;
  await suppressMarketingEmail(delivery.email);
  await recordEmailMarketingEvent({
    campaignId: delivery.campaignId,
    deliveryId: delivery.id,
    email: delivery.email,
    kind: "unsubscribe",
  }).catch(() => null);
  return true;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const ok = await processUnsubscribe(token);
  const dest = new URL(ok ? "/em/unsubscribed?ok=1" : "/em/unsubscribed?ok=0", getSiteUrl());
  return NextResponse.redirect(dest, 302);
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  await processUnsubscribe(token);
  return new NextResponse(null, { status: 200 });
}
