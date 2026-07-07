import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getContactsForSendPicker } from "@/lib/contacts/send-picker";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { parseSendToParam } from "@/lib/contacts/send-link";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { getWalletPricingOptions } from "@/lib/billing/wallet-pricing";
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
  searchParams: Promise<{
    error?: string;
    sent?: string;
    template?: string;
    to?: string;
    country?: string;
    draft?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { countryCode: true },
  });

  const draftPromise = params.draft
    ? prisma.campaign.findFirst({
        where: {
          id: params.draft,
          userId: session.userId,
          status: "DRAFT",
        },
        select: {
          id: true,
          name: true,
          message: true,
          senderId: true,
          recipientsText: true,
          countryCode: true,
          scheduledAt: true,
        },
      })
    : Promise.resolve(null);

  const [senderIds, balance, templates, contactPicker, initialDraft, savedDrafts, pricingCountries] =
    await Promise.all([
      prisma.senderId.findMany({
        where: { userId: session.userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: { value: true, status: true, isDefault: true },
      }),
      getBalanceSnapshot(session.userId),
      prisma.smsTemplate.findMany({
        where: { userId: session.userId },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
        select: { id: true, name: true, content: true },
      }),
      getContactsForSendPicker(session.userId),
      draftPromise,
      prisma.campaign.findMany({
        where: { userId: session.userId, status: "DRAFT" },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          message: true,
          recipientCount: true,
          updatedAt: true,
        },
      }),
      getWalletPricingOptions(session.userId),
    ]);

  if (params.draft && !initialDraft) {
    notFound();
  }

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
            userId={session.userId}
            registeredSenders={senderIds}
            templates={templates}
            pricingCountries={pricingCountries.map((country) => ({
              countryCode: country.countryCode,
              countryName: country.countryName,
            }))}
            initialTemplateId={params.template}
            initialRecipients={parseSendToParam(params.to)}
            defaultCountryCode={params.country ?? user?.countryCode ?? DEFAULT_COUNTRY_CODE}
            initialDraft={
              initialDraft
                ? {
                    id: initialDraft.id,
                    name: initialDraft.name,
                    recipientsText: initialDraft.recipientsText ?? "",
                    body: initialDraft.message,
                    senderId: initialDraft.senderId,
                    countryCode: initialDraft.countryCode,
                    scheduledAt: initialDraft.scheduledAt?.toISOString() ?? null,
                  }
                : null
            }
            savedDrafts={savedDrafts
              .filter((draft) => draft.id !== initialDraft?.id)
              .map((draft) => ({
                id: draft.id,
                name: draft.name,
                message: draft.message,
                recipientCount: draft.recipientCount,
                updatedAt: draft.updatedAt.toISOString(),
              }))}
            contacts={contactPicker.contacts}
            contactGroups={contactPicker.groups}
            totalContacts={contactPicker.totalContacts}
          />
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
