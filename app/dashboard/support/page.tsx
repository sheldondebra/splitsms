import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

async function createTicket(formData: FormData) {
  "use server";
  const { getSession } = await import("@/lib/auth/session");
  const { prisma } = await import("@/lib/db");
  const session = await getSession();
  if (!session) return;
  await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject: String(formData.get("subject")),
      message: String(formData.get("message")),
    },
  });
}

export default function SupportPage() {
  return (
    <AppPage narrow>
      <PageHeader
        title="Support"
        description="Submit a ticket and our team will get back to you."
        icon={LifeBuoy}
        mobileDescription="Describe your issue and we'll follow up."
      />
      <AppCard>
        <CardHeader>
          <CardTitle>New ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTicket} className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input name="subject" required className="mt-1.5" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea name="message" rows={5} required className="mt-1.5" />
            </div>
            <Button type="submit" className="min-h-11 w-full">
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
