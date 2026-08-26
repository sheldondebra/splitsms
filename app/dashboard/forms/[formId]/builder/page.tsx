import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSmartFormForUser } from "@/lib/smart-forms/queries";
import { serializeSmartForm } from "@/lib/smart-forms/serialize";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_EMAIL_SUBJECT,
  DEFAULT_ADMIN_SMS,
  DEFAULT_RESPONDENT_EMAIL,
  DEFAULT_RESPONDENT_EMAIL_SUBJECT,
  DEFAULT_RESPONDENT_SMS,
} from "@/lib/smart-forms/merge-tags";
import { SmartFormBuilder } from "@/components/smart-forms/form-builder";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-config";
import { recaptchaSiteKey } from "@/lib/auth/signup-guard-shared";
import { cn } from "@/lib/utils";
import { FileText, ArrowLeft, QrCode } from "lucide-react";

const TABS = ["field", "form", "sms", "email"] as const;

export default async function SmartFormBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { formId } = await params;
  const query = await searchParams;
  const initialTab = TABS.includes(query.tab as (typeof TABS)[number])
    ? (query.tab as (typeof TABS)[number])
    : "form";

  const [form, contactGroups, senders, credit, user] = await Promise.all([
    getSmartFormForUser(session.userId, formId),
    prisma.contactGroup.findMany({
      where: { userId: session.userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.senderId.findMany({
      where: { userId: session.userId, status: "APPROVED" },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { value: true, isDefault: true },
    }),
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { phone: true, email: true },
    }),
  ]);
  if (!form) notFound();

  const sms = form.smsAutomation;
  const email = form.emailAutomation;

  return (
    <AppPage wide>
      <PageHeader
        title="Form builder"
        description={form.name}
        icon={FileText}
        actions={
          <div className="flex flex-wrap gap-2">
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
        form={serializeSmartForm(form)}
        siteUrl={getSiteUrl()}
        contactGroups={contactGroups}
        senders={senders.map((s) => ({
          value: s.value,
          label: s.value,
          isDefault: s.isDefault,
        }))}
        ownerPhone={user?.phone ?? ""}
        ownerEmail={user?.email?.trim() ?? ""}
        smsCredits={credit?.balance ?? 0}
        smsAutomation={{
          sendToRespondent: sms?.sendToRespondent ?? false,
          sendToAdmin: sms?.sendToAdmin ?? false,
          adminPhone: sms?.adminPhone ?? "",
          senderId: sms?.senderId ?? "",
          respondentMessageTemplate: sms?.respondentMessageTemplate ?? DEFAULT_RESPONDENT_SMS,
          adminMessageTemplate: sms?.adminMessageTemplate ?? DEFAULT_ADMIN_SMS,
        }}
        emailAutomation={{
          sendToRespondent: email?.sendToRespondent ?? false,
          sendToAdmin: email?.sendToAdmin ?? false,
          adminEmail: email?.adminEmail ?? "",
          respondentSubject: email?.respondentSubject ?? DEFAULT_RESPONDENT_EMAIL_SUBJECT,
          respondentMessageTemplate: email?.respondentMessageTemplate ?? DEFAULT_RESPONDENT_EMAIL,
          adminSubject: email?.adminSubject ?? DEFAULT_ADMIN_EMAIL_SUBJECT,
          adminMessageTemplate: email?.adminMessageTemplate ?? DEFAULT_ADMIN_EMAIL,
          reportFrequency: email?.reportFrequency ?? "NONE",
          reportEmail: email?.reportEmail ?? "",
        }}
        initialTab={initialTab}
        recaptchaConfigured={Boolean(
          recaptchaSiteKey() && process.env.RECAPTCHA_SECRET_KEY?.trim(),
        )}
      />
    </AppPage>
  );
}
