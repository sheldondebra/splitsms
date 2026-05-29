import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
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
  searchParams: Promise<{ error?: string; sent?: string; template?: string }>;
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

  const [senderIds, balance, templates] = session
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
      ])
    : [[], null, []];

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
            defaultCountryCode={user?.countryCode ?? DEFAULT_COUNTRY_CODE}
          />
        </AppCardBody>
      </AppCard>
    </AppPage>
  );
}
