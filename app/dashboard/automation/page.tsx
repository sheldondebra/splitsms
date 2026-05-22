import {
  createAutomationAction,
  toggleAutomationAction,
  deleteAutomationAction,
} from "@/lib/actions/automation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Workflow } from "lucide-react";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";

const TRIGGERS = [
  { value: "MANUAL", label: "Manual (starter)" },
  { value: "SIGNUP", label: "User signup" },
  { value: "BIRTHDAY", label: "Birthday reminder" },
  { value: "CAMPAIGN_COMPLETE", label: "After campaign completes" },
  { value: "LOW_BALANCE", label: "Low balance" },
] as const;

export default async function AutomationPage() {
  const session = await getSession();
  if (!session) return null;

  const workflows = await prisma.automationWorkflow.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppPage medium>
      <PageHeader
        title="Automation"
        icon={Workflow}
        mobileDescription="Workflows triggered by events like signup or low balance."
        description="Starter workflows — full multi-step engine ships in a later batch."
      />

      <AppCard className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Welcome workflow (example)</CardTitle>
          <CardDescription>
            User signup → Send welcome SMS → Wait 1 day → Follow-up (configure triggers below)
          </CardDescription>
        </CardHeader>
      </AppCard>

      <AppCard>
        <CardHeader>
          <CardTitle>New workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAutomationAction} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" required placeholder="Welcome SMS" />
            </div>
            <div>
              <Label>Trigger</Label>
              <select
                name="trigger"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="MANUAL"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea name="message" rows={3} required placeholder="Hello {name}!" />
            </div>
            <Button type="submit" className="min-h-11">
              Create workflow
            </Button>
          </form>
        </CardContent>
      </AppCard>

      <div className="space-y-3">
        {workflows.map((w) => (
          <AppCard key={w.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{w.message}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{w.trigger}</Badge>
                  <Badge variant={w.isActive ? "default" : "secondary"}>
                    {w.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <form action={toggleAutomationAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <Button type="submit" size="sm" variant="outline">
                    {w.isActive ? "Pause" : "Enable"}
                  </Button>
                </form>
                <form action={deleteAutomationAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                    Delete
                  </Button>
                </form>
              </div>
            </CardContent>
          </AppCard>
        ))}
      </div>
    </AppPage>
  );
}
