import { prisma } from "@/lib/db";
import type { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/client";
import {
  formatInstrumentLabel,
  methodLabel,
  readPaymentInstrument,
  readPaymentMetadata,
} from "@/lib/payments/payment-display";

export type ResellerPaymentRow = {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  methodLabel: string;
  status: PaymentStatus;
  reference: string | null;
  instrument: string | null;
  payerName: string | null;
  payerPhone: string | null;
  bankName: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    userId: string;
    fullName: string;
    phone: string;
    email: string | null;
    isSuspended: boolean;
  };
};

export type ResellerPaymentsDashboard = {
  stats: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    cancelled: number;
    completedAmount: number;
    failedAmount: number;
    currency: string;
  };
  items: ResellerPaymentRow[];
};

function asNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export async function getResellerPaymentsDashboard(
  resellerId: string,
): Promise<ResellerPaymentsDashboard> {
  const links = await prisma.resellerUser.findMany({
    where: { resellerId },
    select: {
      userId: true,
      isSuspended: true,
      user: { select: { fullName: true, phone: true, email: true } },
    },
  });

  const clientMeta = new Map(
    links.map((link) => [
      link.userId,
      {
        fullName: link.user.fullName,
        phone: link.user.phone,
        email: link.user.email,
        isSuspended: link.isSuspended,
      },
    ]),
  );

  const userIds = [...clientMeta.keys()];
  if (userIds.length === 0) {
    return {
      stats: {
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0,
        cancelled: 0,
        completedAmount: 0,
        failedAmount: 0,
        currency: "GHS",
      },
      items: [],
    };
  }

  const [rows, groups] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { userId: { in: userIds } },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  const countFor = (status: PaymentStatus) =>
    groups.find((g) => g.status === status)?._count.id ?? 0;
  const sumFor = (status: PaymentStatus) =>
    asNumber(groups.find((g) => g.status === status)?._sum.amount ?? 0);

  const currency = rows[0]?.currency ?? "GHS";

  const items: ResellerPaymentRow[] = rows.map((row) => {
    const meta = readPaymentMetadata(row.metadata);
    const instrument = formatInstrumentLabel(readPaymentInstrument(row.metadata));
    const client = clientMeta.get(row.userId) ?? {
      fullName: "Unknown client",
      phone: "—",
      email: null,
      isSuspended: false,
    };

    return {
      id: row.id,
      amount: asNumber(row.amount),
      currency: row.currency,
      method: row.method,
      methodLabel: methodLabel(row.method),
      status: row.status,
      reference: row.providerReference ?? meta.reference ?? null,
      instrument,
      payerName: meta.payerName ?? meta.instrument?.payerName ?? null,
      payerPhone: meta.payerPhone ?? meta.instrument?.payerPhone ?? null,
      bankName: meta.bankName ?? meta.instrument?.bank ?? null,
      note: meta.note ?? null,
      adminNote: row.adminNote,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      client: {
        userId: row.userId,
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
        isSuspended: client.isSuspended,
      },
    };
  });

  return {
    stats: {
      total: groups.reduce((sum, g) => sum + g._count.id, 0),
      completed: countFor("COMPLETED"),
      failed: countFor("FAILED"),
      pending: countFor("PENDING"),
      cancelled: countFor("CANCELLED"),
      completedAmount: sumFor("COMPLETED"),
      failedAmount: sumFor("FAILED"),
      currency,
    },
    items,
  };
}
