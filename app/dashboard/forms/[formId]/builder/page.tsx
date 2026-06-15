import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSmartFormForUser } from "@/lib/smart-forms/queries";
import { serializeSmartForm } from "@/lib/smart-forms/serialize";
import { SmartFormBuilder } from "@/components/smart-forms/form-builder";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { FileText, ArrowLeft, QrCode, MessageSquare } from "lucide-react";

export default async function SmartFormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const [form, contactGroups] = await Promise.all([
    getSmartFormForUser(session.userId, formId),
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!form) notFound();

  const serialized = serializeSmartForm(form);

  return (
    <AppPage wide>
      <PageHeader
        title="Form builder"
        description={form.name}
        icon={FileText}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/forms/${formId}/automation`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <MessageSquare className="h-4 w-4" />
              SMS automation
            </Link>
            <Link
              href={`/dashboard/forms/${formId}/share`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <QrCode className="h-4 w-4" />
              Share
            </Link>
            <Link
              href="/dashboard/forms"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
            >
              <ArrowLeft className="h-4 w-4" />
              All forms
            </Link>
          </div>
        }
      />

      <SmartFormBuilder
        form={serialized}
        siteUrl={getSiteUrl()}
        contactGroups={contactGroups}
      />
    </AppPage>
  );
}
