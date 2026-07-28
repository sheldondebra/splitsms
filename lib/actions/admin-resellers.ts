"use server";

import { prisma } from "@/lib/db";
import { normalizeResellerDomain } from "@/lib/reseller/tenant";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function resellersPath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/resellers${q}`;
}

function resellerDetailPath(resellerId: string, query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/resellers/${resellerId}${q}`;
}

function redirectAfterResellerAction(
  formData: FormData,
  resellerId: string,
  query: Record<string, string>,
) {
  const stayOnDetail = formData.get("returnTo") === "detail";
  redirect(stayOnDetail ? resellerDetailPath(resellerId, query) : resellersPath(query));
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

/** Staff/enterprise roles must never be overwritten by reseller approve/suspend/delete. */
const PROTECTED_USER_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "ENTERPRISE"]);

async function syncUserRoleForReseller(userId: string, nextRole: "RESELLER" | "MEMBER") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || PROTECTED_USER_ROLES.has(user.role)) return;
  if (nextRole === "MEMBER" && user.role !== "RESELLER") return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole },
  });
}

export async function approveResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  const commissionRate = Number(formData.get("commissionRate") ?? 10);

  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "APPROVED", isActive: true, commissionRate },
  });

  await syncUserRoleForReseller(reseller.userId, "RESELLER");

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_APPROVED",
      entityType: "Reseller",
      entityId: resellerId,
      metadata: { commissionRate },
    },
  });

  revalidatePath(`/admin/resellers/${resellerId}`);
  revalidatePath("/admin/resellers");
  redirectAfterResellerAction(formData, resellerId, { saved: "approved" });
}

export async function rejectResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));

  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "REJECTED", isActive: false },
  });

  await syncUserRoleForReseller(reseller.userId, "MEMBER");

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_REJECTED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath(`/admin/resellers/${resellerId}`);
  revalidatePath("/admin/resellers");
  redirectAfterResellerAction(formData, resellerId, { saved: "rejected" });
}

export async function suspendResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "SUSPENDED", isActive: false },
  });

  await syncUserRoleForReseller(reseller.userId, "MEMBER");

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_SUSPENDED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath(`/admin/resellers/${resellerId}`);
  revalidatePath("/admin/resellers");
  redirectAfterResellerAction(formData, resellerId, { saved: "suspended" });
}

export async function reactivateResellerAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const resellerId = String(formData.get("resellerId"));
  const reseller = await prisma.reseller.update({
    where: { id: resellerId },
    data: { status: "APPROVED", isActive: true },
  });

  await syncUserRoleForReseller(reseller.userId, "RESELLER");

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_REACTIVATED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath(`/admin/resellers/${resellerId}`);
  revalidatePath("/admin/resellers");
  redirectAfterResellerAction(formData, resellerId, { saved: "reactivated" });
}

export async function createResellerFromUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const userId = String(formData.get("userId"));
  const businessName = String(formData.get("businessName") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim() || undefined;
  const commissionRate = Number(formData.get("commissionRate") ?? 10);
  const rawDomain = String(formData.get("domain") ?? "").trim();
  const domain = rawDomain ? normalizeResellerDomain(rawDomain) : undefined;

  if (!businessName) redirect(resellersPath({ error: "name" }));

  await prisma.reseller.upsert({
    where: { userId },
    update: {
      businessName,
      brandName,
      domain,
      commissionRate,
      status: "APPROVED",
      isActive: true,
    },
    create: {
      userId,
      businessName,
      brandName,
      domain,
      commissionRate,
      status: "APPROVED",
    },
  });

  await syncUserRoleForReseller(userId, "RESELLER");

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_CREATED",
      entityType: "Reseller",
      entityId: userId,
      metadata: { businessName },
    },
  });

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "created" }));
}

export async function deleteResellerAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  if (confirmation !== "DELETE") {
    redirect(resellerDetailPath(resellerId, { error: "delete_confirm" }));
  }

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { id: true, userId: true, businessName: true, status: true },
  });
  if (!reseller) redirect(resellersPath());

  await syncUserRoleForReseller(reseller.userId, "MEMBER");

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "RESELLER_DELETED",
        entityType: "Reseller",
        entityId: reseller.id,
        metadata: {
          businessName: reseller.businessName,
          previousStatus: reseller.status,
          userId: reseller.userId,
        },
      },
    }),
    prisma.reseller.delete({ where: { id: reseller.id } }),
  ]);

  revalidatePath("/admin/resellers");
  redirect(resellersPath({ saved: "deleted" }));
}

export async function updateResellerSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));

  await prisma.reseller.update({
    where: { id: resellerId },
    data: {
      businessName: String(formData.get("businessName") ?? "").trim() || undefined,
      brandName: String(formData.get("brandName") ?? "").trim() || undefined,
      domain: (() => {
        const raw = String(formData.get("domain") ?? "").trim();
        return raw ? normalizeResellerDomain(raw) : null;
      })(),
      commissionRate: Number(formData.get("commissionRate") ?? 10),
      dailySmsLimit: Number(formData.get("dailySmsLimit") || 0) || null,
      isActive: formData.get("isActive") === "1",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_SETTINGS_UPDATED",
      entityType: "Reseller",
      entityId: resellerId,
    },
  });

  revalidatePath(`/admin/resellers/${resellerId}`);
  revalidatePath("/admin/resellers");
  redirect(`/admin/resellers/${resellerId}?saved=updated`);
}

export async function adminPayoutCommissionsAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const reseller = await prisma.reseller.findUnique({ where: { id: resellerId } });
  if (!reseller) redirect("/admin/resellers");

  const { payoutUnpaidCommissions } = await import("@/lib/reseller/payout");
  try {
    await payoutUnpaidCommissions(reseller.userId, session.userId);
  } catch {
    redirect(`/admin/resellers/${resellerId}?error=payout`);
  }

  revalidatePath(`/admin/resellers/${resellerId}`);
  redirect(`/admin/resellers/${resellerId}?saved=payout`);
}

export async function resellerPayoutCommissionsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { payoutUnpaidCommissions } = await import("@/lib/reseller/payout");
  try {
    await payoutUnpaidCommissions(session.userId, session.userId);
  } catch {
    redirect("/reseller/wallet?error=payout");
  }

  revalidatePath("/reseller");
  revalidatePath("/reseller/wallet");
  redirect("/reseller/wallet?saved=payout");
}

/** Grant or debit SMS credits on the reseller owner account from admin reseller detail. */
export async function adminResellerBonusCreditsAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim();

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { id: true, userId: true, businessName: true },
  });
  if (!reseller) redirect("/admin/resellers");

  if (!Number.isFinite(amount) || amount === 0) {
    redirect(resellerDetailPath(resellerId, { error: "bonus" }));
  }

  const credit = await prisma.smsCredit.findUnique({ where: { userId: reseller.userId } });
  const before = credit?.balance ?? 0;
  const after = before + amount;
  if (after < 0) redirect(resellerDetailPath(resellerId, { error: "credits_negative" }));

  await prisma.$transaction([
    prisma.smsCredit.upsert({
      where: { userId: reseller.userId },
      update: { balance: { increment: amount } },
      create: { userId: reseller.userId, balance: Math.max(0, amount) },
    }),
    prisma.transaction.create({
      data: {
        userId: reseller.userId,
        type: amount > 0 ? "PROMO_CREDIT" : "ADMIN_ADJUSTMENT",
        amount: 0,
        currency: "CREDITS",
        credits: Math.abs(amount),
        description:
          note ||
          (amount > 0
            ? `Admin bonus SMS credits · ${reseller.businessName}`
            : `Admin SMS debit · ${reseller.businessName}`),
        status: "completed",
        metadata: {
          creditsBefore: before,
          creditsAfter: after,
          delta: amount,
          adminId: session.userId,
          resellerId,
          source: "admin_reseller_bonus",
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: amount > 0 ? "RESELLER_BONUS_SMS" : "RESELLER_DEBIT_SMS",
        entityType: "Reseller",
        entityId: resellerId,
        metadata: { amount, note, userId: reseller.userId },
      },
    }),
  ]);

  revalidatePath(resellerDetailPath(resellerId));
  revalidatePath("/admin/resellers");
  revalidatePath(`/admin/members/${reseller.userId}`);
  redirect(resellerDetailPath(resellerId, { saved: "bonus_credits" }));
}

/** Grant or debit wallet funds on the reseller owner account from admin reseller detail. */
export async function adminResellerBonusWalletAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim();

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { id: true, userId: true, businessName: true },
  });
  if (!reseller) redirect("/admin/resellers");

  if (!Number.isFinite(amount) || amount === 0) {
    redirect(resellerDetailPath(resellerId, { error: "bonus" }));
  }

  let wallet = await prisma.wallet.findUnique({ where: { userId: reseller.userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: reseller.userId, balance: 0, currency: "GHS" },
    });
  }

  const before = wallet.balance.toNumber();
  const after = before + amount;
  if (after < 0) redirect(resellerDetailPath(resellerId, { error: "wallet_negative" }));

  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: reseller.userId },
      data: { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: {
        userId: reseller.userId,
        type: amount > 0 ? "PROMO_CREDIT" : "ADMIN_ADJUSTMENT",
        amount: Math.abs(amount),
        currency: wallet.currency,
        description:
          note ||
          (amount > 0
            ? `Admin bonus wallet · ${reseller.businessName}`
            : `Admin wallet debit · ${reseller.businessName}`),
        status: "completed",
        balanceBefore: before,
        balanceAfter: after,
        metadata: {
          delta: amount,
          adminId: session.userId,
          resellerId,
          source: "admin_reseller_bonus",
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: amount > 0 ? "RESELLER_BONUS_WALLET" : "RESELLER_DEBIT_WALLET",
        entityType: "Reseller",
        entityId: resellerId,
        metadata: { amount, note, userId: reseller.userId },
      },
    }),
  ]);

  revalidatePath(resellerDetailPath(resellerId));
  revalidatePath("/admin/resellers");
  revalidatePath(`/admin/members/${reseller.userId}`);
  redirect(resellerDetailPath(resellerId, { saved: "bonus_wallet" }));
}

function revalidateResellerClientPaths(resellerIds: string[], userIds: string[]) {
  for (const id of resellerIds) {
    revalidatePath(resellerDetailPath(id));
  }
  revalidatePath("/admin/resellers");
  for (const userId of userIds) {
    revalidatePath(`/admin/members/${userId}`);
  }
}

/** Create a promo code scoped to a reseller's clients only. */
export async function adminCreateResellerPromoAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "FIXED_CREDIT") as
    | "PERCENT_BONUS"
    | "FIXED_CREDIT"
    | "WALLET_BONUS";
  const value = Number(formData.get("value"));
  const maxUses = Number(formData.get("maxUses") || 0) || undefined;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw) : undefined;

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { id: true, businessName: true },
  });
  if (!reseller) redirect("/admin/resellers");

  if (!code || !Number.isFinite(value) || value <= 0) {
    redirect(resellerDetailPath(resellerId, { error: "promo" }));
  }
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    redirect(resellerDetailPath(resellerId, { error: "promo" }));
  }

  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) redirect(resellerDetailPath(resellerId, { error: "promo_exists" }));

  const promo = await prisma.promoCode.create({
    data: {
      code,
      type,
      value,
      maxUses,
      expiresAt,
      resellerId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "RESELLER_PROMO_CREATED",
      entityType: "PromoCode",
      entityId: promo.id,
      metadata: { code, type, value, resellerId, businessName: reseller.businessName },
    },
  });

  revalidatePath(resellerDetailPath(resellerId));
  redirect(resellerDetailPath(resellerId, { saved: "promo_created" }));
}

/** Toggle a reseller-scoped promo on/off. */
export async function adminToggleResellerPromoAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const promoId = String(formData.get("promoId"));
  const isActive = formData.get("isActive") === "1";

  const promo = await prisma.promoCode.findFirst({
    where: { id: promoId, resellerId },
  });
  if (!promo) redirect(resellerDetailPath(resellerId, { error: "promo" }));

  await prisma.promoCode.update({
    where: { id: promoId },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: isActive ? "RESELLER_PROMO_ACTIVATED" : "RESELLER_PROMO_DEACTIVATED",
      entityType: "PromoCode",
      entityId: promoId,
      metadata: { code: promo.code, resellerId },
    },
  });

  revalidatePath(resellerDetailPath(resellerId));
  redirect(resellerDetailPath(resellerId, { saved: "promo_updated" }));
}

/** Move a client to another reseller or detach to direct platform account. */
export async function adminMoveResellerClientAction(formData: FormData) {
  const session = await requireAdmin();
  const fromResellerId = String(formData.get("fromResellerId"));
  const clientUserId = String(formData.get("clientUserId"));
  const destination = String(formData.get("destination") ?? "platform");
  const targetResellerId = String(formData.get("targetResellerId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!fromResellerId || !clientUserId || !reason) {
    redirect(resellerDetailPath(fromResellerId, { error: "move" }));
  }

  const membership = await prisma.resellerUser.findUnique({
    where: { userId: clientUserId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, role: true, reseller: true } },
      reseller: { select: { id: true, businessName: true } },
    },
  });

  if (!membership || membership.resellerId !== fromResellerId) {
    redirect(resellerDetailPath(fromResellerId, { error: "move_not_found" }));
  }
  if (membership.user.reseller) {
    redirect(resellerDetailPath(fromResellerId, { error: "move_partner_owner" }));
  }

  const revalidateIds = [fromResellerId];
  const revalidateUsers = [clientUserId];

  if (destination === "platform") {
    await prisma.$transaction([
      prisma.resellerUser.delete({ where: { userId: clientUserId } }),
      prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "RESELLER_CLIENT_DETACHED",
          entityType: "User",
          entityId: clientUserId,
          metadata: {
            fromResellerId,
            fromBusinessName: membership.reseller.businessName,
            reason,
            clientName: membership.user.fullName,
            clientPhone: membership.user.phone,
          },
        },
      }),
    ]);
  } else {
    if (!targetResellerId || targetResellerId === fromResellerId) {
      redirect(resellerDetailPath(fromResellerId, { error: "move_target" }));
    }

    const target = await prisma.reseller.findUnique({
      where: { id: targetResellerId },
      select: { id: true, businessName: true, status: true, userId: true },
    });
    if (!target || target.status !== "APPROVED") {
      redirect(resellerDetailPath(fromResellerId, { error: "move_target" }));
    }
    if (target.userId === clientUserId) {
      redirect(resellerDetailPath(fromResellerId, { error: "move_self" }));
    }

    await prisma.$transaction([
      prisma.resellerUser.update({
        where: { userId: clientUserId },
        data: { resellerId: targetResellerId, isSuspended: false },
      }),
      prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: "RESELLER_CLIENT_MOVED",
          entityType: "User",
          entityId: clientUserId,
          metadata: {
            fromResellerId,
            toResellerId: targetResellerId,
            fromBusinessName: membership.reseller.businessName,
            toBusinessName: target.businessName,
            reason,
            clientName: membership.user.fullName,
            clientPhone: membership.user.phone,
          },
        },
      }),
    ]);

    revalidateIds.push(targetResellerId);
  }

  revalidateResellerClientPaths(revalidateIds, revalidateUsers);
  redirect(resellerDetailPath(fromResellerId, { saved: "client_moved" }));
}

/** Attach an existing platform member to this reseller as a client. */
export async function adminAssignMemberToResellerAction(formData: FormData) {
  const session = await requireAdmin();
  const resellerId = String(formData.get("resellerId"));
  const userId = String(formData.get("userId"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!resellerId || !userId) {
    redirect(resellerDetailPath(resellerId, { error: "assign" }));
  }

  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { id: true, businessName: true, status: true, userId: true },
  });
  if (!reseller || reseller.status !== "APPROVED") {
    redirect(resellerDetailPath(resellerId, { error: "assign" }));
  }
  if (reseller.userId === userId) {
    redirect(resellerDetailPath(resellerId, { error: "assign_self" }));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      reseller: true,
      resellerMembership: true,
    },
  });

  if (!user || user.role !== "MEMBER" || user.reseller || user.resellerMembership) {
    redirect(resellerDetailPath(resellerId, { error: "assign_ineligible" }));
  }

  const { getOrCreateMemberAccount } = await import("@/lib/admin/member-account");
  await getOrCreateMemberAccount(userId);

  await prisma.$transaction([
    prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, currency: "GHS" },
    }),
    prisma.smsCredit.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    }),
    prisma.resellerUser.create({
      data: { resellerId, userId },
    }),
    prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: "RESELLER_CLIENT_ASSIGNED",
        entityType: "User",
        entityId: userId,
        metadata: {
          resellerId,
          businessName: reseller.businessName,
          reason: reason || undefined,
          clientName: user.fullName,
          clientPhone: user.phone,
        },
      },
    }),
  ]);

  revalidateResellerClientPaths([resellerId], [userId]);
  redirect(resellerDetailPath(resellerId, { saved: "client_assigned" }));
}
