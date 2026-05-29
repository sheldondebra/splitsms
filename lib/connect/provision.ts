import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { randomBytes } from "crypto";
import { getCountryByCode } from "@/lib/countries-data";
import { normalizePhones } from "@/lib/sms/units";

export type ProvisionConnectCustomerInput = {
  partnerUserId: string;
  fullName: string;
  phone: string;
  countryCode: string;
  email?: string;
  externalRef?: string;
  label?: string;
  initialSmsCredits?: number;
  initialWalletBalance?: number;
  currency?: string;
};

export async function provisionConnectCustomer(input: ProvisionConnectCustomerInput) {
  const phone = normalizePhones(input.phone)[0];
  if (!phone) {
    return { ok: false as const, error: "Invalid phone number" };
  }

  if (input.externalRef) {
    const existingRef = await prisma.connectCustomer.findUnique({
      where: {
        partnerUserId_externalRef: {
          partnerUserId: input.partnerUserId,
          externalRef: input.externalRef,
        },
      },
    });
    if (existingRef) {
      return { ok: false as const, error: "external_ref already exists", customer: existingRef };
    }
  }

  const phoneTaken = await prisma.user.findUnique({ where: { phone } });
  if (phoneTaken) {
    return { ok: false as const, error: "Phone number already registered" };
  }

  if (input.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailTaken) return { ok: false as const, error: "Email already registered" };
  }

  const countryCode = input.countryCode.toUpperCase();
  const currency =
    input.currency ??
    (countryCode === "GH" ? "GHS" : getCountryByCode(countryCode) ? "USD" : "GHS");
  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));

  const customerUser = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      phone,
      email: input.email?.trim() || null,
      countryCode,
      passwordHash,
      isVerified: true,
      role: "MEMBER",
      wallet: {
        create: {
          currency,
          balance: input.initialWalletBalance ?? 0,
        },
      },
      smsCredit: {
        create: { balance: input.initialSmsCredits ?? 0 },
      },
      memberAccount: { create: {} },
    },
  });

  const link = await prisma.connectCustomer.create({
    data: {
      partnerUserId: input.partnerUserId,
      customerUserId: customerUser.id,
      externalRef: input.externalRef?.trim() || null,
      label: input.label?.trim() || input.fullName.trim(),
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          countryCode: true,
          createdAt: true,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.partnerUserId,
      action: "CONNECT_CUSTOMER_PROVISIONED",
      entityType: "ConnectCustomer",
      entityId: link.id,
      metadata: {
        customerUserId: customerUser.id,
        externalRef: input.externalRef,
      },
    },
  });

  return { ok: true as const, customer: link };
}

export async function resolveConnectCustomerUserId(
  partnerUserId: string,
  customerId?: string | null,
): Promise<{ userId: string } | { error: string }> {
  if (!customerId || customerId === "self") {
    return { userId: partnerUserId };
  }

  const link = await prisma.connectCustomer.findFirst({
    where: {
      partnerUserId,
      OR: [{ id: customerId }, { customerUserId: customerId }, { externalRef: customerId }],
    },
  });

  if (!link) return { error: "Connect customer not found" };
  return { userId: link.customerUserId };
}

export function serializeConnectCustomer(
  link: {
    id: string;
    externalRef: string | null;
    label: string | null;
    createdAt: Date;
    customer: {
      id: string;
      fullName: string;
      phone: string;
      email: string | null;
      countryCode: string;
      createdAt: Date;
    };
  },
  wallet?: { balance: { toNumber(): number }; currency: string } | null,
  smsCredit?: { balance: number } | null,
) {
  return {
    id: link.id,
    external_ref: link.externalRef,
    label: link.label,
    user_id: link.customer.id,
    full_name: link.customer.fullName,
    phone: link.customer.phone,
    email: link.customer.email,
    country_code: link.customer.countryCode,
    wallet_balance: wallet?.balance.toNumber() ?? 0,
    wallet_currency: wallet?.currency ?? "GHS",
    sms_credits: smsCredit?.balance ?? 0,
    created_at: link.customer.createdAt.toISOString(),
  };
}
