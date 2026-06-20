import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSmartFormForUser } from "@/lib/smart-forms/queries";
import {
  DEFAULT_ADMIN_SMS,
  DEFAULT_RESPONDENT_SMS,
} from "@/lib/smart-forms/merge-tags";
import { parseFieldValidationRules } from "@/lib/smart-forms/field-meta";
import { FormAutomationPanel } from "@/components/smart-forms/form-automation-panel";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default async function SmartFormAutomationPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const [form, senders, credit, user] = await Promise.all([
    getSmartFormForUser(session.userId, formId),
    prisma.senderId.findMany({
      where: { userId: session.userId, status: "APPROVED" },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { value: true, isDefault: true },
    }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true },
    }),
  ]);

  if (!form) notFound();

  const automation = form.smsAutomation;

  return (
    <AppPage wide>
      <PageHeader
        title="SMS automation"
        description={`Instant SMS for ${form.name}`}
        icon={MessageSquare}
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

      <FormAutomationPanel
        formId={form.id}
        formName={form.name}
        fields={form.fields.map((field) => {
          const rules = parseFieldValidationRules(field.validationRules);
          return {
            fieldKey: field.fieldKey,
            label: field.label,
            dynamicValue: rules.dynamicValue,
          };
        })}
        ownerPhone={user?.phone ?? ""}
        smsCredits={credit?.balance ?? 0}
        senders={senders.map((s) => ({
          value: s.value,
          label: s.value,
          isDefault: s.isDefault,
        }))}
        initial={{
          sendToRespondent: automation?.sendToRespondent ?? false,
          sendToAdmin: automation?.sendToAdmin ?? false,
          adminPhone: automation?.adminPhone ?? "",
          senderId: automation?.senderId ?? "",
          respondentMessageTemplate:
            automation?.respondentMessageTemplate ?? DEFAULT_RESPONDENT_SMS,
          adminMessageTemplate: automation?.adminMessageTemplate ?? DEFAULT_ADMIN_SMS,
        }}
      />
    </AppPage>
  );
}
