import { prisma } from "@/lib/db";

export type AdminSearchKind = "member" | "sender" | "payment" | "transaction" | "message";

export type AdminSearchHit = {
  id: string;
  kind: AdminSearchKind;
  /** Record this row opens, such as Member or Payment. */
  label: string;
  /** Field that matched the query, such as Phone, Amount, or Member ID. */
  related: string;
  title: string;
  subtitle: string;
  href: string;
  status?: string;
  statusTone?: "ok" | "warn" | "danger" | "muted";
};

const MEMBER_ROLES = ["MEMBER", "RESELLER", "ENTERPRISE"] as const;

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function looksLikeEmail(q: string) {
  return q.includes("@");
}

export function looksLikePhone(q: string) {
  const numeric = digits(q);
  return numeric.length >= 6 && /^[\d+\s().-]+$/.test(q.trim());
}

function looksLikeId(q: string) {
  const trimmed = q.trim();
  return /^[a-z0-9_-]{6,}$/i.test(trimmed) && !looksLikeEmail(q) && !/\s/.test(trimmed);
}

/** Match a typed amount, including a one-decimal prefix such as 137.6 → 137.60–137.69. */
export function moneyBounds(raw: string): { gte: number; lt: number } | null {
  const cleaned = raw
    .trim()
    .replace(/,/g, "")
    .replace(/^(ghs|usd|eur|gbp|ngn)\s*/i, "")
    .replace(/^[₵$£€]\s*/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  if (!cleaned.includes(".")) return { gte: value, lt: value + 1 };
  const frac = cleaned.split(".")[1] ?? "";
  const step = frac.length >= 2 ? 0.005 : 0.1;
  return { gte: value, lt: Math.round((value + step) * 1000) / 1000 };
}

function phoneNeedles(q: string) {
  const numeric = digits(q);
  const needles = new Set<string>();
  const trimmed = q.trim();
  if (trimmed) needles.add(trimmed);
  if (numeric.length >= 4) needles.add(numeric);
  if (numeric.startsWith("0") && numeric.length > 4) needles.add(numeric.slice(1));
  if (numeric.startsWith("233") && numeric.length > 6) {
    needles.add(numeric.slice(3));
    needles.add(`0${numeric.slice(3)}`);
  }
  return [...needles];
}

function phoneMatches(q: string, phone: string) {
  const phoneDigits = digits(phone);
  const queryDigits = digits(q);
  if (queryDigits.length >= 4 && phoneDigits.includes(queryDigits)) return true;
  if (queryDigits.startsWith("233") && phoneDigits.includes(queryDigits.slice(3))) return true;
  if (queryDigits.startsWith("0") && phoneDigits.includes(queryDigits.slice(1))) return true;
  return phone.toLowerCase().includes(q.trim().toLowerCase());
}

type MemberFields = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  accountNumber: number | null;
  walletBalance?: number | null;
  smsCredits?: number | null;
  businessName?: string | null;
};

export function memberRelatedLabel(q: string, user: MemberFields) {
  const lower = q.trim().toLowerCase();
  const money = moneyBounds(q);
  if (looksLikeId(q) && user.id.toLowerCase().includes(lower)) return "Member ID";
  if (/^\d+$/.test(q.trim()) && user.accountNumber != null && String(user.accountNumber) === q.trim()) {
    return "Account no.";
  }
  if (user.email?.toLowerCase().includes(lower)) return "Email";
  if (phoneMatches(q, user.phone)) return "Phone";
  if (
    money &&
    user.walletBalance != null &&
    user.walletBalance >= money.gte &&
    user.walletBalance < money.lt
  ) {
    return "Wallet";
  }
  if (
    /^\d+$/.test(q.trim()) &&
    user.smsCredits != null &&
    String(user.smsCredits) === q.trim()
  ) {
    return "SMS credits";
  }
  if (user.businessName?.toLowerCase().includes(lower)) return "Business";
  if (user.fullName.toLowerCase().includes(lower)) return "Name";
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

function messageStatusTone(status: string): AdminSearchHit["statusTone"] {
  if (status === "DELIVERED" || status === "SENT") return "ok";
  if (status === "PENDING" || status === "QUEUED") return "warn";
  if (status === "FAILED") return "danger";
  return "muted";
}

const TRANSACTION_LABEL: Record<string, string> = {
  CREDIT_PURCHASE: "Credit purchase",
  SMS_DEBIT: "SMS debit",
  REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Adjustment",
  PROMO_CREDIT: "Promo",
  RESELLER_SUB_FUND: "Reseller fund",
  WALLET_TOPUP: "Wallet top-up",
  PAYMENT_REFUND: "Payment refund",
};

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 12)}…` : id;
}

function personRelated(
  q: string,
  person: { id: string; fullName: string; phone: string; email?: string | null },
) {
  const lower = q.trim().toLowerCase();
  if (looksLikeId(q) && person.id.toLowerCase().includes(lower)) return "Member ID";
  if (person.email?.toLowerCase().includes(lower)) return "Email";
  if (phoneMatches(q, person.phone)) return "Phone";
  if (person.fullName.toLowerCase().includes(lower)) return "Name";
  return "Member";
}

export async function adminGlobalSearch(query: string, limit = 8): Promise<AdminSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const take = Math.min(Math.max(limit, 1), 8);
  const money = moneyBounds(q);
  const needles = looksLikePhone(q) || (!q.includes(".") && digits(q).length >= 6) ? phoneNeedles(q) : [];
  const idQuery = looksLikeId(q);
  const accountNo = /^\d{1,9}$/.test(q) ? Number(q) : null;
  const creditNo = /^\d{1,7}$/.test(q) ? Number(q) : null;

  const memberOr = [
    { fullName: { contains: q, mode: "insensitive" as const } },
    { email: { contains: q, mode: "insensitive" as const } },
    { referralCode: { contains: q, mode: "insensitive" as const } },
    { reseller: { businessName: { contains: q, mode: "insensitive" as const } } },
    { reseller: { brandName: { contains: q, mode: "insensitive" as const } } },
    ...needles.map((needle) => ({ phone: { contains: needle } })),
    ...(idQuery ? [{ id: { contains: q, mode: "insensitive" as const } }] : []),
    ...(accountNo != null ? [{ accountNumber: accountNo }] : []),
    ...(money ? [{ wallet: { balance: money } }] : []),
    ...(creditNo != null ? [{ smsCredit: { balance: creditNo } }] : []),
  ];

  const userTextOr = [
    { fullName: { contains: q, mode: "insensitive" as const } },
    { email: { contains: q, mode: "insensitive" as const } },
    ...needles.map((needle) => ({ phone: { contains: needle } })),
    ...(idQuery ? [{ id: { contains: q, mode: "insensitive" as const } }] : []),
  ];

  const [members, senders, payments, transactions, messages] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...MEMBER_ROLES] }, OR: memberOr },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        accountNumber: true,
        wallet: { select: { balance: true, currency: true } },
        smsCredit: { select: { balance: true } },
        reseller: { select: { businessName: true } },
      },
    }),
    prisma.senderId.findMany({
      where: {
        OR: [
          { value: { contains: q, mode: "insensitive" } },
          { user: { OR: userTextOr } },
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
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { providerReference: { contains: q, mode: "insensitive" } },
          { adminNote: { contains: q, mode: "insensitive" } },
          ...(money ? [{ amount: money }] : []),
          { user: { OR: userTextOr } },
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
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { reference: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          ...(money ? [{ amount: money }] : []),
          { user: { OR: userTextOr } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        credits: true,
        reference: true,
        description: true,
        status: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    }),
    prisma.message.findMany({
      where: {
        OR: [
          { recipient: { contains: needles[0] ?? q } },
          { senderId: { contains: q, mode: "insensitive" } },
          { providerRef: { contains: q, mode: "insensitive" } },
          ...(idQuery ? [{ id: { contains: q, mode: "insensitive" } }] : []),
          ...(!money && !looksLikePhone(q) && q.length >= 4
            ? [{ body: { contains: q, mode: "insensitive" as const } }]
            : []),
          { user: { OR: userTextOr } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        recipient: true,
        senderId: true,
        body: true,
        status: true,
        providerRef: true,
        user: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  const hits: AdminSearchHit[] = [];
  const lower = q.toLowerCase();

  for (const member of members) {
    const related = memberRelatedLabel(q, {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      accountNumber: member.accountNumber,
      walletBalance: member.wallet ? Number(member.wallet.balance) : null,
      smsCredits: member.smsCredit?.balance ?? null,
      businessName: member.reseller?.businessName ?? null,
    });
    const wallet =
      member.wallet != null
        ? `${member.wallet.currency} ${Number(member.wallet.balance).toFixed(2)}`
        : null;
    hits.push({
      id: `member-${member.id}`,
      kind: "member",
      label: "Member",
      related,
      title: member.fullName,
      subtitle: [
        member.accountNumber != null ? `#${member.accountNumber}` : null,
        member.phone,
        member.email,
        wallet ? `Wallet ${wallet}` : null,
        member.smsCredit ? `${member.smsCredit.balance} SMS credits` : null,
        `ID ${shortId(member.id)}`,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/members/${member.id}`,
      status: member.isVerified ? "Verified" : member.role,
      statusTone: member.isVerified ? "ok" : "muted",
    });
  }

  for (const sender of senders) {
    const related = sender.value.toLowerCase().includes(lower)
      ? "Sender ID"
      : personRelated(q, sender.user);
    hits.push({
      id: `sender-${sender.id}`,
      kind: "sender",
      label: "Sender ID",
      related,
      title: sender.value,
      subtitle: `${sender.user.fullName} · ${sender.user.phone} · ${sender.countryCode}${sender.isDefault ? " · Default" : ""}`,
      href: `/admin/members/${sender.user.id}`,
      status: sender.status === "APPROVED" ? "Approved" : sender.status === "PENDING" ? "Pending" : sender.status,
      statusTone: senderStatusTone(sender.status),
    });
  }

  for (const payment of payments) {
    const amount = Number(payment.amount);
    const amountHit = money != null && amount >= money.gte && amount < money.lt;
    const refHit = payment.providerReference?.toLowerCase().includes(lower) ?? false;
    const idHit = payment.id.toLowerCase().includes(lower);
    const related = amountHit
      ? "Amount"
      : refHit
        ? "Reference"
        : idHit
          ? "Payment ID"
          : personRelated(q, payment.user);
    hits.push({
      id: `payment-${payment.id}`,
      kind: "payment",
      label: "Payment",
      related,
      title: `${payment.currency} ${amount.toFixed(2)}`,
      subtitle: [
        payment.user.fullName,
        payment.user.phone,
        payment.method,
        payment.providerReference,
        `ID ${shortId(payment.id)}`,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/payments/transactions?q=${encodeURIComponent(payment.providerReference || payment.id)}`,
      status: payment.status.charAt(0) + payment.status.slice(1).toLowerCase(),
      statusTone: paymentStatusTone(payment.status),
    });
  }

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    const amountHit = money != null && amount >= money.gte && amount < money.lt;
    const refHit = tx.reference?.toLowerCase().includes(lower) ?? false;
    const detailHit = tx.description?.toLowerCase().includes(lower) ?? false;
    const related = amountHit
      ? "Amount"
      : refHit
        ? "Reference"
        : detailHit
          ? "Detail"
          : tx.id.toLowerCase().includes(lower)
            ? "Transaction ID"
            : personRelated(q, tx.user);
    hits.push({
      id: `tx-${tx.id}`,
      kind: "transaction",
      label: "Transaction",
      related,
      title: tx.currency === "CREDITS" ? `${tx.credits ?? 0} credits` : `${tx.currency} ${amount.toFixed(2)}`,
      subtitle: [
        TRANSACTION_LABEL[tx.type] ?? tx.type,
        tx.user.fullName,
        tx.reference,
        tx.description,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/members/${tx.user.id}?tab=billing`,
      status: tx.status,
      statusTone: tx.status === "completed" ? "ok" : tx.status === "failed" ? "danger" : "muted",
    });
  }

  for (const message of messages) {
    const senderHit = message.senderId.toLowerCase().includes(lower);
    const recipientHit = phoneMatches(q, message.recipient) || message.recipient.includes(q);
    const bodyHit = message.body.toLowerCase().includes(lower);
    const related = senderHit
      ? "Sender ID"
      : recipientHit
        ? "Phone"
        : message.providerRef?.toLowerCase().includes(lower)
          ? "Reference"
          : bodyHit
            ? "Message"
            : personRelated(q, { ...message.user, phone: "" });
    const preview = message.body.replace(/\s+/g, " ").trim().slice(0, 80);
    hits.push({
      id: `sms-${message.id}`,
      kind: "message",
      label: "SMS",
      related,
      title: message.recipient,
      subtitle: [`From ${message.senderId}`, message.user.fullName, preview].filter(Boolean).join(" · "),
      href: `/admin/messages?q=${encodeURIComponent(message.recipient)}`,
      status: message.status.charAt(0) + message.status.slice(1).toLowerCase(),
      statusTone: messageStatusTone(message.status),
    });
  }

  hits.sort((a, b) => {
    const score = (hit: AdminSearchHit) => {
      let value = 0;
      if (hit.kind === "sender" && hit.title.toLowerCase() === lower) value += 100;
      if (hit.related === "Member ID" && hit.id.toLowerCase().includes(lower)) value += 90;
      if (hit.kind === "sender" && hit.title.toLowerCase().startsWith(lower)) value += 40;
      if (hit.related === "Email" || hit.related === "Phone" || hit.related === "Sender ID") value += 30;
      if (hit.related === "Amount" || hit.related === "Wallet" || hit.related === "Account no.") value += 24;
      if (hit.kind === "member" && hit.title.toLowerCase().startsWith(lower)) value += 20;
      if (hit.related === "Name") value += 8;
      return value;
    };
    return score(b) - score(a);
  });

  return hits.slice(0, 12);
}
