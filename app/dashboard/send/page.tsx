import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getContactsForSendPicker } from "@/lib/contacts/send-picker";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { parseSendToParam } from "@/lib/contacts/send-link";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { SendSmsForm } from "@/components/sms/send-sms-form";
import { SendPageToasts } from "@/components/sms/send-page-toasts";
import { Suspense } from "react";
import { AppPage, PageHeader, AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import Link from "next/link";
import { Send, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default async function SendSmsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; template?: string; to?: string; country?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const defaultSender =
    process.env.MNOTIFY_DEFAULT_SENDER_ID ??
    process.env.MNOTIFY_SENDER_ID ??
    "SplitSMS";

  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { countryCode: true },
      })
    : null;

  const [senderIds, balance, templates, contactPicker] = session
    ? await Promise.all([
        prisma.senderId.findMany({
          where: { userId: session.userId, status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        }),
        getBalanceSnapshot(session.userId),
        prisma.smsTemplate.findMany({
          where: { userId: session.userId },
          orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
          select: { id: true, name: true, content: true },
        }),
        getContactsForSendPicker(session.userId),
      ])
    : [[], null, [], { contacts: [], groups: [], totalContacts: 0 }];

  return (
    <AppPage>
      <PageHeader
        title="Send SMS"
        description="Pick a template or write your own — preview how it looks before you send."
        icon={Send}
        mobileDescription="Template, message preview, cost estimate, then send."
        actions={
          <Link
            href="/dashboard/wallet"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 h-10 rounded-xl font-medium",
            )}
          >
            <Wallet className="h-4 w-4" />
            {balance?.creditBalance ?? 0} credits
          </Link>
        }
      />

      <Suspense fallback={null}>
        <SendPageToasts />
      </Suspense>

      <AppCard className="overflow-visible">
        <AppCardBody>
          <SendSmsForm
            defaultSender={defaultSender}
            senderOptions={senderIds.map((s) => ({ value: s.value }))}
            templates={templates}
            initialTemplateId={params.template}
            initialRecipients={parseSendToParam(params.to)}
            defaultCountryCode={params.country ?? user?.countryCode ?? DEFAULT_COUNTRY_CODE}
            contacts={contactPicker.contacts}
            contactGroups={contactPicker.groups}
            totalContacts={contactPicker.totalContacts}
          />
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
