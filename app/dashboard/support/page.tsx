import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <Card className="max-w-lg">
      <CardHeader><CardTitle>Support</CardTitle></CardHeader>
      <CardContent>
        <form action={createTicket} className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Input name="subject" required />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea name="message" rows={4} required />
          </div>
          <Button type="submit">Submit ticket</Button>
        </form>
      </CardContent>
    </Card>
  );
}
