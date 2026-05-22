import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { SendSmsForm } from "@/components/sms/send-sms-form";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Send SMS</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Enter numbers, write your message, and tap send.
        </p>
      </div>

      <FriendlyAlert error={params.error} success={params.sent} />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <SendSmsForm
            defaultSender={defaultSender}
            senderOptions={senderIds.map((s) => ({ value: s.value }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
