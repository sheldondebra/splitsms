import { sendSmsAction } from "@/lib/actions/sms";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { SendCostPreview } from "@/components/sms/send-cost-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function SendSmsPage() {
  const session = await getSession();
  const defaultSender =
    process.env.MNOTIFY_DEFAULT_SENDER_ID ??
    process.env.MNOTIFY_SENDER_ID ??
    "SplitSMS";

  const [senderIds, pricing] = session
    ? await Promise.all([
        prisma.senderId.findMany({
          where: { userId: session.userId, status: "APPROVED" },
        }),
        prisma.smsPricing.findFirst({
          where: { country: { code: "GH" } },
        }),
      ])
    : [[], null];

  const unitPrice = pricing?.memberPrice.toNumber() ?? 0.029;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Send SMS</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send to one or many recipients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New bulk message</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={sendSmsAction} className="space-y-4">
              <div>
                <Label htmlFor="senderId">Sender ID</Label>
                <Input
                  id="senderId"
                  name="senderId"
                  defaultValue={senderIds[0]?.value ?? defaultSender}
                  required
                />
              </div>
              <div>
                <Label htmlFor="countryCode">Country</Label>
                <Input id="countryCode" name="countryCode" defaultValue="GH" required />
              </div>
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" name="body" rows={4} required />
              </div>
              <div>
                <Label htmlFor="recipients">Recipients (one per line)</Label>
                <Textarea
                  id="recipients"
                  name="recipients"
                  rows={6}
                  placeholder="233201234567&#10;233501234567"
                  required
                />
              </div>
              <Button type="submit" className="font-semibold">
                Send SMS
              </Button>
            </form>
          </CardContent>
        </Card>
        <SendCostPreview unitPrice={unitPrice} />
      </div>
    </div>
  );
}
