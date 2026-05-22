import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { SendSmsForm } from "@/components/sms/send-sms-form";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default async function SendSmsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const defaultSender =
    process.env.MNOTIFY_DEFAULT_SENDER_ID ??
    process.env.MNOTIFY_SENDER_ID ??
    "SplitSMS";

  const senderIds = session
    ? await prisma.senderId.findMany({
        where: { userId: session.userId, status: "APPROVED" },
      })
    : [];

  return (
    <AppPage narrow>
      <PageHeader
        title="Send SMS"
        description="Enter numbers, write your message, and tap send."
        icon={Send}
        mobileDescription="Enter numbers, write your message, and tap send."
      />

      <FriendlyAlert error={params.error} success={params.sent} />

      <AppCard>
        <CardContent className="pt-6 pb-6">
          <SendSmsForm
            defaultSender={defaultSender}
            senderOptions={senderIds.map((s) => ({ value: s.value }))}
          />
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
