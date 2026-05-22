import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  toggleTemplateFavoriteAction,
} from "@/lib/actions/templates";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERSONALIZATION_HINT } from "@/lib/sms/personalize";
import { FileText, Star } from "lucide-react";
import Link from "next/link";

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) return null;

  const templates = await prisma.smsTemplate.findMany({
    where: { userId: session.userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <AppPage medium>
      <PageHeader
        title="SMS templates"
        description={PERSONALIZATION_HINT}
        icon={FileText}
        mobileDescription="Reusable messages for campaigns."
      />

      <AppCard>
        <CardHeader>
          <CardTitle>New template</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTemplateAction} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" required placeholder="Welcome message" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                name="content"
                rows={4}
                required
                placeholder="Hello {name}, thanks for joining!"
              />
            </div>
            <Button type="submit" className="min-h-11">
              Save template
            </Button>
          </form>
        </CardContent>
      </AppCard>

      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No templates yet.</p>
        ) : (
          templates.map((t) => (
            <AppCard key={t.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {t.name}
                  {t.isFavorite && <Star className="h-4 w-4 fill-primary text-primary" />}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <form action={toggleTemplateFavoriteAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <Button type="submit" size="sm" variant="outline" className="min-h-10">
                      {t.isFavorite ? "Unfavorite" : "Favorite"}
                    </Button>
                  </form>
                  <form action={deleteTemplateAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive min-h-10">
                      Delete
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap rounded-xl border bg-muted/20 p-3">
                  {t.content}
                </p>
                <form action={updateTemplateAction} className="space-y-2">
                  <input type="hidden" name="id" value={t.id} />
                  <Input name="name" defaultValue={t.name} />
                  <Textarea name="content" rows={3} defaultValue={t.content} />
                  <Button type="submit" size="sm" className="w-full sm:w-auto min-h-11">
                    Update
                  </Button>
                </form>
                <Link href={`/dashboard/campaigns/new?template=${t.id}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    Use in campaign →
                  </Badge>
                </Link>
              </CardContent>
            </AppCard>
          ))
        )}
      </div>
    </AppPage>
  );
}
