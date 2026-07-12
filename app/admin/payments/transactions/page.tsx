import { prisma } from "@/lib/db";
import { serializeAdminPayment } from "@/lib/admin/payments-serialize";
import { AdminProviderTransactionsView } from "@/components/admin/admin-provider-transactions-view";
import type { PaymentMethod, PaymentStatus, Prisma } from "@/lib/generated/prisma/client";

const PAGE_SIZE = 25;

type ProviderFilter = "all" | "paystack" | "stripe";
type StatusFilter = "all" | PaymentStatus;

function parseProvider(value: string | undefined): ProviderFilter {
  if (value === "paystack" || value === "stripe") return value;
  return "all";
}

function parseStatus(value: string | undefined): StatusFilter {
  if (
    value === "PENDING" ||
    value === "COMPLETED" ||
    value === "FAILED" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return "all";
}

function providerMethods(provider: ProviderFilter): PaymentMethod[] {
  if (provider === "paystack") return ["PAYSTACK"];
  if (provider === "stripe") return ["STRIPE"];
  return ["PAYSTACK", "STRIPE"];
}

export default async function AdminProviderTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    provider?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const provider = parseProvider(params.provider);
  const status = parseStatus(params.status);
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.PaymentWhereInput = {
    method: { in: providerMethods(provider) },
  };

  if (status !== "all") {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { providerReference: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { fullName: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminProviderTransactionsView
      payments={payments.map(serializeAdminPayment)}
      filters={{ provider, status, q, page }}
      pagination={{ total, totalPages, pageSize: PAGE_SIZE }}
    />
  );
}
