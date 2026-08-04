import { prisma } from "@/lib/db";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { deductSmsCredits } from "@/lib/sms/billing";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";
import { countSmsUnits } from "@/lib/sms/units";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";
import { getAccessTokenForUser } from "@/lib/google/connection";
import {
  getGoogleFormQuestions,
  listGoogleFormResponses,
  pickPhoneFromAnswers,
  renderTemplate,
} from "@/lib/google/forms";
import { GOOGLE_FORMS_SCOPES } from "@/lib/google/scopes";

async function sendGoogleFormSms(opts: {
  userId: string;
  recipientRaw: string;
  body: string;
  senderIdRaw: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const phoneCheck = validateRecipientPhone(opts.recipientRaw);
  if (!phoneCheck.valid) return { ok: false, error: "invalid_phone" };

  const recipient = phoneCheck.normalized.replace(/^\+/, "");
  const units = countSmsUnits(opts.body);
  if (!opts.body.trim() || units < 1) return { ok: false, error: "empty_body" };

  let senderId: string;
  try {
    senderId = await resolveApprovedSenderForUser(opts.userId, opts.senderIdRaw);
  } catch {
    return { ok: false, error: "sender" };
  }

  const countryCode = detectCountryCode(phoneCheck.normalized) ?? "GH";
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode }, isActive: true },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const totalCost = costPerUnit * units;
  const wallet = await prisma.wallet.findUnique({ where: { userId: opts.userId } });
  const currency = wallet?.currency ?? "GHS";

  try {
    await deductSmsCredits(
      opts.userId,
      units,
      totalCost,
      currency,
      "Google Form SMS",
      countryCode,
    );
  } catch {
    return { ok: false, error: "credits" };
  }

  const priority = resolveMessagePriority({ channel: "google_form", body: opts.body });
  const message = await prisma.message.create({
    data: {
      userId: opts.userId,
      recipient,
      body: opts.body,
      countryCode,
      senderId,
      smsUnits: units,
      cost: totalCost,
      status: "PENDING",
      priority,
      channel: "google_form",
    },
  });

  await enqueueSmsJob(message.id, countryCode, priority);

  return { ok: true, messageId: message.id };
}

export async function pollGoogleFormAutomation(automationId: string) {
  const automation = await prisma.googleFormSmsAutomation.findUnique({
    where: { id: automationId },
  });
  if (!automation || !automation.isActive) return { processed: 0 };

  const token = await getAccessTokenForUser(automation.userId, [...GOOGLE_FORMS_SCOPES]);
  if (!token.ok) {
    await prisma.googleFormSmsAutomation.update({
      where: { id: automationId },
      data: { lastError: token.code, lastPolledAt: new Date() },
    });
    return { processed: 0, error: token.code };
  }

  let responses;
  try {
    const filter = automation.cursor
      ? `timestamp > ${automation.cursor}`
      : undefined;
    responses = await listGoogleFormResponses(token.accessToken, automation.formId, {
      filter,
      pageSize: 50,
    });
  } catch (e) {
    await prisma.googleFormSmsAutomation.update({
      where: { id: automationId },
      data: {
        lastError: e instanceof Error ? e.message : "forms_list_failed",
        lastPolledAt: new Date(),
      },
    });
    return { processed: 0 };
  }

  // Newest first from API — process oldest first for cursor stability
  responses = [...responses].sort(
    (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
  );

  const titles =
    (automation.questionTitles as Record<string, string> | null) ?? {};
  let processed = 0;
  let latestCursor = automation.cursor;

  for (const row of responses) {
    const existing = await prisma.googleFormSmsSend.findUnique({
      where: {
        automationId_responseId: {
          automationId: automation.id,
          responseId: row.responseId,
        },
      },
    });
    if (existing) {
      latestCursor = row.createTime;
      continue;
    }

    const phone = pickPhoneFromAnswers(row.answers, automation.phoneFieldId);
    if (!phone) {
      await prisma.googleFormSmsSend.create({
        data: {
          automationId: automation.id,
          responseId: row.responseId,
          status: "skipped",
          error: "no_phone",
        },
      });
      latestCursor = row.createTime;
      continue;
    }

    const body = renderTemplate(automation.messageTemplate, row.answers, titles);
    const send = await sendGoogleFormSms({
      userId: automation.userId,
      recipientRaw: phone,
      body,
      senderIdRaw: automation.senderId,
    });

    await prisma.googleFormSmsSend.create({
      data: {
        automationId: automation.id,
        responseId: row.responseId,
        phone,
        status: send.ok ? "queued" : "failed",
        error: send.ok ? null : send.error,
      },
    });

    if (!send.ok && send.error === "credits") {
      await prisma.googleFormSmsAutomation.update({
        where: { id: automation.id },
        data: {
          isActive: false,
          lastError: "insufficient_credits",
          lastPolledAt: new Date(),
          cursor: latestCursor,
        },
      });
      return { processed, paused: true };
    }

    processed++;
    latestCursor = row.createTime;
  }

  await prisma.googleFormSmsAutomation.update({
    where: { id: automation.id },
    data: {
      cursor: latestCursor,
      lastPolledAt: new Date(),
      lastError: null,
    },
  });

  return { processed };
}

export async function pollAllGoogleFormAutomations() {
  const automations = await prisma.googleFormSmsAutomation.findMany({
    where: { isActive: true },
    orderBy: { lastPolledAt: "asc" },
    take: 50,
  });

  let total = 0;
  for (const a of automations) {
    const result = await pollGoogleFormAutomation(a.id);
    total += result.processed;
  }
  return { automations: automations.length, processed: total };
}

export async function loadFormQuestionsForUser(userId: string, formId: string) {
  const token = await getAccessTokenForUser(userId, [...GOOGLE_FORMS_SCOPES]);
  if (!token.ok) return { ok: false as const, code: token.code, missingScopes: token.missingScopes };
  const detail = await getGoogleFormQuestions(token.accessToken, formId);
  return { ok: true as const, ...detail };
}
