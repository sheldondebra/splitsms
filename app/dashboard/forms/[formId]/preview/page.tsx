import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSmartFormForPreview } from "@/lib/smart-forms/public";
import { PublicSmartFormView } from "@/components/smart-forms/public-smart-form";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, ArrowLeft } from "lucide-react";

export default async function SmartFormPreviewPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const form = await getSmartFormForPreview(session.userId, formId);
  if (!form) notFound();

  return (
    <AppPage wide>
      <PageHeader
        title="Form preview"
        description="This is how your form will look to visitors. Submissions are disabled until published."
        icon={Eye}
        actions={
          <Link
            href={`/dashboard/forms/${formId}/builder`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to builder
          </Link>
        }
      />
      <div className="overflow-hidden rounded-xl border">
        <PublicSmartFormView form={form} mode="preview" />
      </div>
    </AppPage>
  );
}
