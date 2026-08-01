import {
  buildMarketingParts,
  type MarketingEmailContentInput,
} from "@/lib/admin/email-marketing-content";
import { renderEmailLayout } from "@/lib/email/render";

/** Server-only: applies admin email branding from the database. */
export async function marketingEmailContent(input: MarketingEmailContentInput) {
  const parts = buildMarketingParts(input);
  return {
    subject: parts.subject,
    text: parts.text,
    html: await renderEmailLayout(parts.layoutParams),
  };
}
