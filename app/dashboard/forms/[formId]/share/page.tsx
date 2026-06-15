import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSmartFormForUser } from "@/lib/smart-forms/queries";
import { FormSharePanel } from "@/components/smart-forms/form-share-panel";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { QrCode, ArrowLeft } from "lucide-react";

export default async function SmartFormSharePage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const form = await getSmartFormForUser(session.userId, formId);
  if (!form) notFound();

  return (
    <AppPage wide>
      <PageHeader
        title="Share & embed"
        description={`Share ${form.name} via link, QR code, or embed.`}
        icon={QrCode}
        actions={
          <Link
            href={`/dashboard/forms/${form.id}/builder`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to builder
          </Link>
        }
      />

      <FormSharePanel
        formId={form.id}
        formName={form.name}
        shortCode={form.shortCode}
        status={form.status}
        siteUrl={getSiteUrl()}
      />
    </AppPage>
  );
}
