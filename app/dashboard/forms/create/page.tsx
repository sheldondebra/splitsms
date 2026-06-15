import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CreateSmartFormPanel } from "@/components/smart-forms/create-smart-form-panel";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { FileText } from "lucide-react";

export default async function CreateSmartFormPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;

  const groups = await prisma.contactGroup.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppPage>
      <PageHeader
        title="Create form"
        description="Start from a template or blank canvas, then customize in the builder."
        icon={FileText}
      />

      {params.error === "name" ? (
        <FriendlyAlert error="Enter a form name to continue." />
      ) : params.error === "limit" ? (
        <FriendlyAlert error="Form limit reached. Delete an old form or upgrade your plan." />
      ) : null}

      <CreateSmartFormPanel groups={groups} />
    </AppPage>
  );
}
