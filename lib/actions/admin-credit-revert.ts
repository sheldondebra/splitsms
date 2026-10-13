"use server";

import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";
import { adminBalanceAdjustmentEmailContent } from "@/lib/email/templates";
import { loadCreditRevertContext } from "@/lib/admin/credit-revert";
import { walletValueForCredits } from "@/lib/admin/credit-revert-quote";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function safeReturnTo(value: string, fallback: string) {
  if (!value.startsWith("/admin/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

function withQuery(path: string, query: Record<string, string>) {
  const [base, existing] = path.split("?");
  const params = new URLSearchParams(existing ?? "");
  for (const [key, value] of Object.entries(query)) params.set(key, value);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function revertCreditsToWalletAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const userId = String(formData.get("userId") ?? "");
  const credits = Math.floor(Number(formData.get("credits")));
  const notify = formData.get("notify") === "1";
  const returnTo = safeReturnTo(
    String(formData.get("returnTo") ?? ""),
    userId ? `/admin/members/${userId}?tab=billing` : "/admin/credit-cover",
  );

  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    redirect(withQuery(returnTo, { error: "revert_credits" }));
  }

  const context = await loadCreditRevertContext(userId);
  if (!context) redirect(withQuery(returnTo, { error: "revert_member" }));
  if (credits > context.unusedCredits) {
    redirect(withQuery(returnTo, { error: "revert_balance" }));
  }
  if (credits > context.cashableCredits) {
    redirect(withQuery(returnTo, { error: "revert_unpaid" }));
  }
  if (!(context.rate > 0)) {
    redirect(withQuery(returnTo, { error: "revert_rate" }));
  }

  const walletAmount = walletValueForCredits(credits, context.rate);
  if (!(walletAmount > 0)) {
    redirect(withQuery(returnTo, { error: "revert_rate" }));
  }

  const note = `Reverted ${credits.toLocaleString()} SMS credits to wallet`;

  try {
    await prisma.$transaction(async (tx) => {
      const debited = await tx.smsCredit.updateMany({
        where: { userId, balance: { gte: credits } },
        data: { balance: { decrement: credits } },
      });
      if (debited.count === 0) throw new Error("balance");

      const credit = await tx.smsCredit.findUnique({ where: { userId } });
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0, currency: context.currency },
      });
      const before = wallet.balance.toNumber();
      const after = Math.round((before + walletAmount) * 100) / 100;

      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: walletAmount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "ADMIN_ADJUSTMENT",
          amount: 0,
          currency: "CREDITS",
          credits,
          description: note,
          status: "completed",
          metadata: {
            delta: -credits,
            creditsBefore: (credit?.balance ?? 0) + credits,
            creditsAfter: credit?.balance ?? 0,
            adminId: session.userId,
            source: "credit_revert",
            walletAmount,
            rate: context.rate,
          },
        },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "ADMIN_ADJUSTMENT",
          amount: walletAmount,
          currency: wallet.currency,
          description: note,
          status: "completed",
          balanceBefore: before,
          balanceAfter: after,
          metadata: {
            delta: walletAmount,
            creditsReverted: credits,
            rate: context.rate,
            adminId: session.userId,
            source: "credit_revert",
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "CREDIT_REVERT_TO_WALLET",
          entityType: "User",
          entityId: userId,
          metadata: { credits, walletAmount, currency: wallet.currency, rate: context.rate },
        },
      });
    });
  } catch {
    redirect(withQuery(returnTo, { error: "revert_balance" }));
  }

  let emailOk = true;
  const email = context.email?.trim();
  if (notify && email) {
    const content = await adminBalanceAdjustmentEmailContent({
      memberName: context.fullName,
      kind: "wallet",
      delta: walletAmount,
      currency: context.currency,
      balanceAfter: Math.round((context.walletBalance + walletAmount) * 100) / 100,
      note: `${note} at ${context.currency} ${context.rate.toFixed(4)} per credit.`,
    });
    const sent = await sendEmail({
      to: email,
      toName: context.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    emailOk = sent.ok;
  }

  revalidatePath("/admin/credit-cover");
  revalidatePath(`/admin/members/${userId}`);
  redirect(withQuery(returnTo, { saved: emailOk ? "reverted" : "reverted_email_failed" }));
}
