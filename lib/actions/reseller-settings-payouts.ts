"use server";

import { getSession, getRealSession, isAdminRole } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { normalizeResellerDomain } from "@/lib/reseller/tenant";
import { saveResellerLogoUpload } from "@/lib/reseller/logo-upload";
import {
  getOrCreateResellerPaymentSettings,
  getResellerAvailablePayoutBalance,
} from "@/lib/reseller/payment-settings";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ResellerCheckoutMode,
  ResellerPayoutMethod,
  ResellerPayoutStatus,
} from "@/lib/generated/prisma/client";

function settingsPath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/reseller/settings${q}`;
}

function payoutPath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/reseller/payouts${q}`;
}

function adminPayoutPath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/reseller-payouts${q}`;
}

export async function saveResellerBrandingSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const logoFile = formData.get("logoFile");
  let logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;

  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveResellerLogoUpload(logoFile, reseller.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "upload_failed";
      redirect(settingsPath({ tab: "branding", error: encodeURIComponent(msg) }));
    }
  }

  const data = {
    logoUrl: logoUrl || undefined,
    primaryColor: String(formData.get("primaryColor") ?? "#f97316"),
    secondaryColor: String(formData.get("secondaryColor") ?? "#0f0f0f"),
    accentColor: String(formData.get("accentColor") ?? "").trim() || undefined,
    supportEmail: String(formData.get("supportEmail") ?? "").trim() || undefined,
  };

  await prisma.whiteLabelBrand.upsert({
    where: { resellerId: reseller.id },
    update: data,
    create: { resellerId: reseller.id, ...data },
  });

  await prisma.reseller.update({
    where: { id: reseller.id },
    data: {
      brandName: String(formData.get("brandName") ?? "").trim() || reseller.brandName,
    },
  });

  revalidatePath("/reseller/settings");
  redirect(settingsPath({ tab: "branding", saved: "branding" }));
}

export async function saveResellerDomainSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const rawDomain = String(formData.get("domain") ?? "").trim();
  await prisma.reseller.update({
    where: { id: reseller.id },
    data: { domain: rawDomain ? normalizeResellerDomain(rawDomain) : null },
  });

  revalidatePath("/reseller/settings");
  redirect(settingsPath({ tab: "domain", saved: "domain" }));
}

export async function testResellerDomainConnectionAction(domain: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Sign in required." };
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) return { ok: false as const, error: "Reseller access required." };

  const { checkResellerDomainDns } = await import("@/lib/reseller/domain-dns-check");
  const result = await checkResellerDomainDns(domain);
  if (result.ok) {
    return {
      ok: true as const,
      domain: result.domain,
      detail: result.detail ?? "DNS is pointing at SplitSMS.",
    };
  }
  return {
    ok: false as const,
    domain: result.domain,
    error: result.error ?? "Domain is not connected yet.",
  };
}

export async function saveResellerGatewaySettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const checkoutMode = String(formData.get("checkoutMode") ?? "PLATFORM") as ResellerCheckoutMode;
  if (checkoutMode !== "PLATFORM" && checkoutMode !== "OWN") {
    redirect(settingsPath({ tab: "payments", error: "invalid_mode" }));
  }

  const existing = await getOrCreateResellerPaymentSettings(reseller.id);
  const keepSecret = (incoming: string, previous: string | null) => {
    const value = incoming.trim();
    if (!value || value.includes("••••")) return previous;
    return value;
  };

  await prisma.resellerPaymentSettings.update({
    where: { resellerId: reseller.id },
    data: {
      checkoutMode,
      paystackEnabled: formData.get("paystackEnabled") === "1",
      paystackPublicKey: String(formData.get("paystackPublicKey") ?? "").trim() || null,
      paystackSecretKey: keepSecret(
        String(formData.get("paystackSecretKey") ?? ""),
        existing.paystackSecretKey,
      ),
      stripeEnabled: formData.get("stripeEnabled") === "1",
      stripePublishableKey: String(formData.get("stripePublishableKey") ?? "").trim() || null,
      stripeSecretKey: keepSecret(
        String(formData.get("stripeSecretKey") ?? ""),
        existing.stripeSecretKey,
      ),
    },
  });

  revalidatePath("/reseller/settings");
  redirect(settingsPath({ tab: "payments", saved: "payments" }));
}

export async function saveResellerPayoutDetailsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const method = String(formData.get("payoutMethod") ?? "MOBILE_MONEY") as ResellerPayoutMethod;
  if (method !== "MOBILE_MONEY" && method !== "BANK_TRANSFER") {
    redirect(settingsPath({ tab: "payout", error: "invalid_method" }));
  }

  await getOrCreateResellerPaymentSettings(reseller.id);
  await prisma.resellerPaymentSettings.update({
    where: { resellerId: reseller.id },
    data: {
      payoutMethod: method,
      payoutPhone: String(formData.get("payoutPhone") ?? "").trim() || null,
      payoutAccountName: String(formData.get("payoutAccountName") ?? "").trim() || null,
      payoutBankName: String(formData.get("payoutBankName") ?? "").trim() || null,
      payoutAccountNumber: String(formData.get("payoutAccountNumber") ?? "").trim() || null,
      payoutNotes: String(formData.get("payoutNotes") ?? "").trim() || null,
    },
  });

  const returnTo = String(formData.get("returnTo") ?? "settings");
  revalidatePath("/reseller/settings");
  revalidatePath("/reseller/payouts");
  if (returnTo === "payouts") {
    redirect(payoutPath({ saved: "details" }));
  }
  redirect(settingsPath({ tab: "payout", saved: "payout" }));
}

export async function requestResellerPayoutAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const amount = Number(formData.get("amount"));
  const note = String(formData.get("resellerNote") ?? "").trim() || null;
  const funds = await getResellerAvailablePayoutBalance(session.userId, reseller.id);
  const settings = await getOrCreateResellerPaymentSettings(reseller.id);

  if (!Number.isFinite(amount) || amount < 1) {
    redirect(payoutPath({ error: "invalid_amount" }));
  }
  if (amount > funds.available) {
    redirect(payoutPath({ error: "insufficient" }));
  }

  if (settings.payoutMethod === "MOBILE_MONEY" && !settings.payoutPhone) {
    redirect(payoutPath({ error: "missing_details" }));
  }
  if (
    settings.payoutMethod === "BANK_TRANSFER" &&
    (!settings.payoutAccountName || !settings.payoutAccountNumber)
  ) {
    redirect(payoutPath({ error: "missing_details" }));
  }

  await prisma.resellerPayoutRequest.create({
    data: {
      resellerId: reseller.id,
      amount,
      currency: funds.currency,
      method: settings.payoutMethod,
      phone: settings.payoutPhone,
      accountName: settings.payoutAccountName,
      bankName: settings.payoutBankName,
      accountNumber: settings.payoutAccountNumber,
      resellerNote: note,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_PAYOUT_REQUESTED",
      entityType: "ResellerPayoutRequest",
      entityId: reseller.id,
      metadata: { amount, currency: funds.currency },
    },
  });

  revalidatePath("/reseller/payouts");
  revalidatePath("/admin/reseller-payouts");
  redirect(payoutPath({ saved: "requested" }));
}

export async function cancelResellerPayoutAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const payoutId = String(formData.get("payoutId") ?? "");
  const row = await prisma.resellerPayoutRequest.findFirst({
    where: { id: payoutId, resellerId: reseller.id, status: "PENDING" },
  });
  if (!row) redirect(payoutPath({ error: "not_found" }));

  await prisma.resellerPayoutRequest.update({
    where: { id: row.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/reseller/payouts");
  redirect(payoutPath({ saved: "cancelled" }));
}

export async function adminUpdateResellerPayoutAction(formData: FormData) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const payoutId = String(formData.get("payoutId") ?? "");
  const nextStatus = String(formData.get("status") ?? "") as ResellerPayoutStatus;
  const adminNote = String(formData.get("adminNote") ?? "").trim() || null;

  const allowed: ResellerPayoutStatus[] = [
    "APPROVED",
    "PROCESSING",
    "PAID",
    "REJECTED",
  ];
  if (!allowed.includes(nextStatus)) {
    redirect(adminPayoutPath({ error: "invalid_status" }));
  }

  const row = await prisma.resellerPayoutRequest.findUnique({
    where: { id: payoutId },
    include: { reseller: true },
  });
  if (!row) redirect(adminPayoutPath({ error: "not_found" }));

  if (["PAID", "REJECTED", "CANCELLED"].includes(row.status)) {
    redirect(adminPayoutPath({ error: "already_closed" }));
  }

  if (nextStatus === "PAID") {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: row.reseller.userId },
    });
    if (!wallet || wallet.balance.toNumber() < row.amount.toNumber()) {
      redirect(adminPayoutPath({ error: "insufficient_wallet" }));
    }

    const before = wallet.balance.toNumber();
    const amount = row.amount.toNumber();

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: row.reseller.userId },
        data: { balance: { decrement: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: row.reseller.userId,
          type: "RESELLER_PAYOUT",
          amount,
          currency: row.currency,
          description: `Reseller payout ${row.id}`,
          status: "completed",
          balanceBefore: before,
          balanceAfter: before - amount,
          metadata: {
            payoutRequestId: row.id,
            method: row.method,
            actorId: session.userId,
          },
        },
      }),
      prisma.resellerPayoutRequest.update({
        where: { id: row.id },
        data: {
          status: "PAID",
          adminNote,
          reviewedById: session.userId,
          reviewedAt: new Date(),
          paidAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "RESELLER_PAYOUT_PAID",
          entityType: "ResellerPayoutRequest",
          entityId: row.id,
          metadata: { amount, resellerId: row.resellerId },
        },
      }),
    ]);
  } else {
    await prisma.resellerPayoutRequest.update({
      where: { id: row.id },
      data: {
        status: nextStatus,
        adminNote,
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: `RESELLER_PAYOUT_${nextStatus}`,
        entityType: "ResellerPayoutRequest",
        entityId: row.id,
        metadata: { amount: row.amount.toNumber() },
      },
    });
  }

  revalidatePath("/admin/reseller-payouts");
  revalidatePath("/reseller/payouts");
  redirect(adminPayoutPath({ saved: nextStatus.toLowerCase() }));
}
