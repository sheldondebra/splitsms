import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  toggleTemplateFavoriteAction,
} from "@/lib/actions/templates";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          SMS templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{PERSONALIZATION_HINT}</p>
      </div>

      <Card>
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
            <Button type="submit">Save template</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        ) : (
          templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {t.name}
                  {t.isFavorite && <Star className="h-4 w-4 fill-primary text-primary" />}
                </CardTitle>
                <div className="flex gap-2">
                  <form action={toggleTemplateFavoriteAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <Button type="submit" size="sm" variant="outline">
                      {t.isFavorite ? "Unfavorite" : "Favorite"}
                    </Button>
                  </form>
                  <form action={deleteTemplateAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap rounded border bg-muted/20 p-3">{t.content}</p>
                <form action={updateTemplateAction} className="space-y-2">
                  <input type="hidden" name="id" value={t.id} />
                  <Input name="name" defaultValue={t.name} />
                  <Textarea name="content" rows={3} defaultValue={t.content} />
                  <Button type="submit" size="sm">
                    Update
                  </Button>
                </form>
                <Link href={`/dashboard/campaigns/new?template=${t.id}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    Use in campaign →
                  </Badge>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
