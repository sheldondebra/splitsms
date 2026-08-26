import { prisma } from "@/lib/db";
import { creditsFromAmount } from "@/lib/billing/sms-packages";
import { purchaseCredits } from "@/lib/payments/wallet";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { readTopUpCreditMeta } from "@/lib/payments/topup-credit-meta";

export { asMetadataRecord, readTopUpCreditMeta } from "@/lib/payments/topup-credit-meta";
export type { TopUpCreditMeta } from "@/lib/payments/topup-credit-meta";

/** Convert a funded top-up into SMS credits at the member's assigned (or default) rate. */
export async function convertTopUpToCredits(
  paymentId: string,
): Promise<{ credits: number; cost: number } | null> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "COMPLETED") return null;

  const meta = readTopUpCreditMeta(payment.metadata);
  if (!meta.buyCreditsOnFund || meta.creditsConvertedAt) {
    return meta.creditsConverted && meta.creditsConvertedCost
      ? { credits: meta.creditsConverted, cost: meta.creditsConvertedCost }
      : null;
  }

  const countryCode = meta.creditCountryCode || "GH";
  const price = await resolveSmsPriceForUser(payment.userId, countryCode);
  if (price.sellPrice <= 0) return null;
  if (price.currency !== payment.currency) {
    console.warn("[wallet] skip auto credit convert: currency mismatch", {
      paymentId,
      wallet: payment.currency,
      pricing: price.currency,
    });
    return null;
  }

  const quote = creditsFromAmount(payment.amount.toNumber(), price.sellPrice);
  if (quote.credits < 1) return null;

  const claimedAt = new Date().toISOString();
  const claimed = await prisma.$executeRawUnsafe(
    `UPDATE "Payment"
     SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
     WHERE id = $2
       AND status = 'COMPLETED'
       AND COALESCE(metadata->>'buyCreditsOnFund', '') = 'true'
       AND metadata->>'creditsConvertedAt' IS NULL`,
    JSON.stringify({
      buyCreditsOnFund: true,
      creditCountryCode: countryCode,
      creditsConvertedAt: claimedAt,
      creditsConverted: quote.credits,
      creditsConvertedCost: quote.cost,
    }),
    paymentId,
  );
  if (claimed !== 1) {
    const latest = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { metadata: true },
    });
    const existing = readTopUpCreditMeta(latest?.metadata);
    return existing.creditsConverted && existing.creditsConvertedCost
      ? { credits: existing.creditsConverted, cost: existing.creditsConvertedCost }
      : null;
  }

  try {
    await purchaseCredits(payment.userId, quote.credits, quote.cost, payment.currency);
    return { credits: quote.credits, cost: quote.cost };
  } catch (err) {
    console.error("[wallet] auto credit convert failed", paymentId, err);
    await prisma.$executeRawUnsafe(
      `UPDATE "Payment"
       SET metadata = metadata - 'creditsConvertedAt' - 'creditsConverted' - 'creditsConvertedCost'
       WHERE id = $1`,
      paymentId,
    );
    return null;
  }
}
