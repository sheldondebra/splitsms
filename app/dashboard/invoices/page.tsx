import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { InvoicesView } from "@/components/billing/invoices-view";
import { serializeInvoice } from "@/lib/billing/invoices";
import { Receipt } from "lucide-react";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) return null;

  let invoices: ReturnType<typeof serializeInvoice>[] = [];
  let loadError: string | null = null;

  try {
    const rows = await prisma.invoice.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    invoices = rows.map(serializeInvoice);
  } catch (e) {
    console.error("[invoices]", e);
    loadError = "Billing records could not be loaded. Refresh the page and try again.";
  }

  return (
    <AppPage wide>
      <PageHeader
        title="Invoices"
        description="Download PDFs, search your billing history, and export a CSV of paid invoices."
        icon={Receipt}
        mobileDescription="Search, filter, and download your invoices."
      />
      <InvoicesView invoices={invoices} loadError={loadError} />
    </AppPage>
  );
}
