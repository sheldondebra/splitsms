import { prisma } from "@/lib/db";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { countSmsUnits } from "@/lib/sms/units";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";

export const ADMIN_TEST_CHANNEL = "admin_test";

/**
 * Sends a real message through the normal provider pipeline (same routing,
 * same Message record, same delivery-report sync) so results are trustworthy —
 * but skips wallet debit, since this is an internal connectivity/delivery
 * check, not a customer send. Cost is still computed and stored for display.
 */
export async function sendAdminTestSms(opts: {
  adminUserId: string;
  recipientRaw: string;
  body: string;
  senderId: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; recipient: string; error: string }> {
  const phoneCheck = validateRecipientPhone(opts.recipientRaw);
  if (!phoneCheck.valid) {
    return { ok: false, recipient: opts.recipientRaw, error: "Invalid phone number" };
  }

  const recipient = phoneCheck.normalized.replace(/^\+/, "");
  const units = countSmsUnits(opts.body);
  if (!opts.body.trim() || units < 1) {
    return { ok: false, recipient: phoneCheck.display, error: "Message is empty" };
  }

  const countryCode = detectCountryCode(phoneCheck.normalized) ?? "GH";
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode }, isActive: true },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const totalCost = costPerUnit * units;

  const priority = resolveMessagePriority({ channel: ADMIN_TEST_CHANNEL, body: opts.body });
  const message = await prisma.message.create({
    data: {
      userId: opts.adminUserId,
      recipient,
      body: opts.body,
      countryCode,
      senderId: opts.senderId,
      smsUnits: units,
      cost: totalCost,
      status: "PENDING",
      priority,
      channel: ADMIN_TEST_CHANNEL,
    },
  });

  await enqueueSmsJob(message.id, countryCode, priority);

  return { ok: true, messageId: message.id };
}
