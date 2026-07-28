import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { prisma } from "@/lib/db";
import { ResellerPortalPromosView } from "@/components/reseller/reseller-portal-promos-view";
import { redirect } from "next/navigation";

export default async function ResellerPromosPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const params = await searchParams;
  const promos = await prisma.promoCode.findMany({
    where: { resellerId: reseller.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <ResellerPortalPromosView
      promos={promos.map((p) => ({
        id: p.id,
        code: p.code,
        type: p.type,
        value: p.value.toNumber(),
        maxUses: p.maxUses,
        usedCount: p.usedCount,
        redemptionCount: p._count.redemptions,
        expiresAt: p.expiresAt,
        isActive: p.isActive,
        createdAt: p.createdAt,
      }))}
      flash={{ saved: params.saved, error: params.error }}
    />
  );
}
