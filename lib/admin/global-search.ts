import { prisma } from "@/lib/db";

export type AdminSearchHit = {
  id: string;
  kind: "member" | "sender" | "payment";
  label: string;
  title: string;
  subtitle: string;
  href: string;
  status?: string;
  statusTone?: "ok" | "warn" | "danger" | "muted";
};

function looksLikeEmail(q: string) {
  return q.includes("@");
}

function looksLikePhone(q: string) {
  const digits = q.replace(/\D/g, "");
  return digits.length >= 6 && /^[\d+\s().-]+$/.test(q.trim());
}

function looksLikeId(q: string) {
  return /^[a-z0-9_-]{8,}$/i.test(q.trim()) && !looksLikeEmail(q) && !/\s/.test(q);
}

function memberMatchLabel(q: string, user: { fullName: string; email: string | null; phone: string }) {
  const lower = q.toLowerCase();
  if (looksLikeEmail(q) && user.email?.toLowerCase().includes(lower)) return "Email";
  if (looksLikePhone(q) && user.phone.includes(q.replace(/\s/g, ""))) return "Phone";
  if (user.email?.toLowerCase().includes(lower) && (looksLikeEmail(q) || user.email.toLowerCase().startsWith(lower))) {
    return "Email";
  }
  if (user.phone.includes(q.replace(/\D/g, "")) || user.phone.includes(q)) return "Phone";
  if (user.fullName.toLowerCase().includes(lower)) return "Name";
  if (user.email?.toLowerCase().includes(lower)) return "Email";
  return "Member";
}

function paymentStatusTone(status: string): AdminSearchHit["statusTone"] {
  if (status === "COMPLETED") return "ok";
  if (status === "PENDING") return "warn";
  if (status === "FAILED" || status === "CANCELLED") return "danger";
  return "muted";
}

function senderStatusTone(status: string): AdminSearchHit["statusTone"] {
  if (status === "APPROVED") return "ok";
  if (status === "PENDING") return "warn";
  if (status === "REJECTED" || status === "BLOCKED") return "danger";
  return "muted";
}

export async function adminGlobalSearch(query: string, limit = 8): Promise<AdminSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const take = Math.min(Math.max(limit, 1), 12);
  const digitQ = q.replace(/\D/g, "");

  const [members, senders, payments] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["MEMBER", "RESELLER", "ENTERPRISE"] },
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          ...(digitQ.length >= 4 ? [{ phone: { contains: digitQ } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
      },
    }),
    prisma.senderId.findMany({
      where: {
        OR: [
          { value: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        value: true,
        status: true,
        countryCode: true,
        isDefault: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { providerReference: { contains: q, mode: "insensitive" } },
          ...(looksLikeId(q) ? [{ id: { equals: q } }] : []),
          { user: { fullName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        method: true,
        providerReference: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
  ]);

  const hits: AdminSearchHit[] = [];

  for (const m of members) {
    hits.push({
      id: `member-${m.id}`,
      kind: "member",
      label: memberMatchLabel(q, m),
      title: m.fullName,
      subtitle: [m.phone, m.email].filter(Boolean).join(" · "),
      href: `/admin/members/${m.id}`,
      status: m.isVerified ? "Verified" : m.role,
      statusTone: m.isVerified ? "ok" : "muted",
    });
  }

  for (const s of senders) {
    hits.push({
      id: `sender-${s.id}`,
      kind: "sender",
      label: "Sender ID",
      title: s.value,
      subtitle: `${s.user.fullName} · ${s.user.phone} · ${s.countryCode}${s.isDefault ? " · Default" : ""}`,
      href: `/admin/members/${s.user.id}`,
      status: s.status === "APPROVED" ? "Approved" : s.status === "PENDING" ? "Pending" : s.status,
      statusTone: senderStatusTone(s.status),
    });
  }

  for (const p of payments) {
    const amount = p.amount.toString();
    hits.push({
      id: `payment-${p.id}`,
      kind: "payment",
      label: p.providerReference?.toLowerCase().includes(q.toLowerCase())
        ? "Provider ref"
        : "Payment ID",
      title: `${p.currency} ${amount}`,
      subtitle: `${p.user.fullName} · ${p.method} · ${p.id.slice(0, 12)}…`,
      href: `/admin/payments/transactions?q=${encodeURIComponent(p.providerReference || p.id)}`,
      status: p.status.charAt(0) + p.status.slice(1).toLowerCase(),
      statusTone: paymentStatusTone(p.status),
    });
  }

  // Prefer exact-ish matches first: sender value exact, payment id prefix, then members
  const lower = q.toLowerCase();
  hits.sort((a, b) => {
    const score = (h: AdminSearchHit) => {
      let s = 0;
      if (h.kind === "sender" && h.title.toLowerCase() === lower) s += 100;
      if (h.kind === "sender" && h.title.toLowerCase().startsWith(lower)) s += 40;
      if (h.kind === "payment" && h.id.includes(lower)) s += 30;
      if (h.kind === "member" && h.title.toLowerCase().startsWith(lower)) s += 20;
      if (h.label === "Email" || h.label === "Phone") s += 10;
      return s;
    };
    return score(b) - score(a);
  });

  return hits.slice(0, take + 4);
}
