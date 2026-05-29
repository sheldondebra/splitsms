import { prisma } from "@/lib/db";
import type { AutomationTrigger } from "@/lib/generated/prisma/client";
import { countSmsUnits } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { personalizeMessage } from "@/lib/sms/personalize";
import { resolveMessagePriority } from "@/lib/enterprise/priority";

export type AutomationContact = {
  phone: string;
  name?: string | null;
  email?: string | null;
  countryCode?: string | null;
};

export type AutomationContext = {
  contact: AutomationContact;
  replacements?: Record<string, string>;
};

/**
 * Run active workflows for a trigger. Sends SMS to the contact in `ctx.contact`.
 * Failures are logged and never throw to callers.
 */
export async function runAutomationWorkflows(
  userId: string,
  trigger: AutomationTrigger,
  ctx: AutomationContext,
) {
  try {
    const { contact } = ctx;
    if (!contact.phone) return;

    const workflows = await prisma.automationWorkflow.findMany({
      where: { userId, trigger, isActive: true },
    });
    if (!workflows.length) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { countryCode: true },
    });
    if (!user) return;

    const approvedSender = await prisma.senderId.findFirst({
      where: { userId, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    });

    const countryCode = contact.countryCode ?? user.countryCode ?? "GH";

    for (const wf of workflows) {
      const config = (wf.config ?? {}) as { senderId?: string };
      const senderCandidate = config.senderId ?? approvedSender?.value ?? null;
      if (!senderCandidate) continue;

      let senderId: string;
      try {
        const { assertApprovedSenderForUser } = await import(
          "@/lib/sender-ids/validate-send"
        );
        const row = await assertApprovedSenderForUser(userId, senderCandidate);
        senderId = row.value;
      } catch {
        continue;
      }

      let body = wf.message;
      for (const [key, value] of Object.entries(ctx.replacements ?? {})) {
        body = body.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
      }
      body = personalizeMessage(body, {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        country: contact.countryCode,
      });

      const units = countSmsUnits(body);
      const pricing = await prisma.smsPricing.findFirst({
        where: { country: { code: countryCode }, isActive: true },
      });
      const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
      const totalCost = costPerUnit * units;

      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      const currency = wallet?.currency ?? "GHS";

      try {
        await deductSmsCredits(
          userId,
          units,
          totalCost,
          currency,
          `Automation: ${wf.name}`,
          countryCode,
        );
      } catch {
        continue;
      }

      const priority = resolveMessagePriority({ channel: "automation", body });
      const message = await prisma.message.create({
        data: {
          userId,
          recipient: contact.phone,
          body,
          countryCode,
          senderId,
          smsUnits: units,
          cost: totalCost,
          status: "PENDING",
          priority,
          channel: "automation",
        },
      });
      await enqueueSmsJob(message.id, countryCode, priority);
    }
  } catch (err) {
    console.error("[automation]", trigger, err);
  }
}

/** Fire SIGNUP automations when a brand-new contact is saved. */
export async function runContactSignupAutomations(
  userId: string,
  contact: AutomationContact,
) {
  await runAutomationWorkflows(userId, "SIGNUP", { contact });
}
