import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { FORM_TEMPLATES } from "@/lib/smart-forms/templates";
import { createSmartFormFromTemplateAction } from "@/lib/actions/smart-forms";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileStack, ArrowLeft, Check } from "lucide-react";

export default async function SmartFormTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;

  return (
    <AppPage>
      <PageHeader
        title="Form templates"
        description="Start from a proven layout — customize fields and branding in the builder."
        icon={FileStack}
        actions={
          <Link
            href="/dashboard/forms"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2")}
          >
            <ArrowLeft className="h-4 w-4" />
            All forms
          </Link>
        }
      />

      {params.error === "limit" ? (
        <FriendlyAlert error="Form limit reached. Delete an old form or upgrade your plan." />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FORM_TEMPLATES.filter((t) => t.id !== "blank").map((template) => (
          <AppCard key={template.id}>
            <AppCardBody className="p-5 flex flex-col h-full">
              <h2 className="font-semibold">{template.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{template.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {template.fields.length} starter field{template.fields.length === 1 ? "" : "s"}
              </p>
              <form action={createSmartFormFromTemplateAction} className="mt-4">
                <input type="hidden" name="templateId" value={template.id} />
                <input type="hidden" name="name" value={template.name} />
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full h-10 gap-2 font-semibold",
                  )}
                >
                  <Check className="h-4 w-4" />
                  Use template
                </button>
              </form>
            </AppCardBody>
          </AppCard>
        ))}
      </div>
    </AppPage>
  );
}
