function csvEscape(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: (string | number | null | undefined)[]) {
  return cells.map(csvEscape).join(",");
}

export function exportResellerClientsCsv(
  clients: {
    fullName: string;
    phone: string;
    email: string | null;
    countryCode: string;
    credits: number;
    walletBalance: number;
    currency: string;
    messages: number;
    isVerified: boolean;
    isSuspended: boolean;
    createdAt: string;
  }[],
) {
  const header = csvRow([
    "Name",
    "Phone",
    "Email",
    "Country",
    "SMS credits",
    "Wallet balance",
    "Currency",
    "Messages",
    "Verified",
    "Status",
    "Created",
  ]);
  const rows = clients.map((c) =>
    csvRow([
      c.fullName,
      c.phone,
      c.email,
      c.countryCode,
      c.credits,
      c.walletBalance.toFixed(2),
      c.currency,
      c.messages,
      c.isVerified ? "yes" : "no",
      c.isSuspended ? "suspended" : "active",
      c.createdAt,
    ]),
  );
  return [header, ...rows].join("\n");
}

export function exportResellerPaymentsCsv(
  payments: {
    clientName: string;
    clientPhone: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    reference: string | null;
    createdAt: string;
  }[],
) {
  const header = csvRow([
    "Client",
    "Phone",
    "Amount",
    "Currency",
    "Method",
    "Status",
    "Reference",
    "Date",
  ]);
  const rows = payments.map((p) =>
    csvRow([
      p.clientName,
      p.clientPhone,
      p.amount.toFixed(2),
      p.currency,
      p.method,
      p.status,
      p.reference,
      p.createdAt,
    ]),
  );
  return [header, ...rows].join("\n");
}
