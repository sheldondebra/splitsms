"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  toggleTemplateFavoriteAction,
  seedSampleTemplatesAction,
} from "@/lib/actions/templates";
import { SmsPreview } from "@/components/sms/sms-preview";
import { TEMPLATE_VARIABLES, PERSONALIZATION_HINT } from "@/lib/sms/personalize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  LayoutTemplate,
  Star,
  Trash2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export type TemplateItem = {
  id: string;
  name: string;
  content: string;
  isFavorite: boolean;
  updatedAt: string;
};

function insertVariable(content: string, key: string) {
  const token = `{${key}}`;
  return content ? `${content}${content.endsWith(" ") ? "" : " "}${token}` : token;
}

function TemplateEditor({
  name,
  content,
  onNameChange,
  onContentChange,
  onInsertVariable,
}: {
  name: string;
  content: string;
  onNameChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onInsertVariable: (key: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-5 min-w-0">
        <div className="space-y-2">
          <Label htmlFor="tpl-name">Template name</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Welcome message"
            className="h-11 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tpl-content">Message content</Label>
          <Textarea
            id="tpl-content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={6}
            placeholder="Hi {firstName}, thanks for joining!"
            className="min-h-[140px] text-base resize-y"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">{PERSONALIZATION_HINT}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Insert placeholder</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map((v) => (
              <Button
                key={v.key}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs font-mono"
                onClick={() => onInsertVariable(v.key)}
              >
                {`{${v.key}}`}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <SmsPreview message={content} showVariableHints />
    </div>
  );
}

export function TemplatesManager({ templates: initial }: { templates: TemplateItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const sorted = useMemo(
    () =>
      [...initial].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [initial],
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setContent("");
    setDialogOpen(true);
  }

  function openEdit(t: TemplateItem) {
    setEditing(t);
    setName(t.name);
    setContent(t.content);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleInsertVariable(key: string) {
    setContent((c) => insertVariable(c, key));
  }

  async function handleSave() {
    if (!name.trim() || !content.trim()) {
      toast.error("Name and message are required");
      return;
    }
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("content", content.trim());
    if (editing) fd.set("id", editing.id);

    startTransition(async () => {
      const result = editing
        ? await updateTemplateAction(fd)
        : await createTemplateAction(fd);
      if (!result.ok) {
        toast.error("Could not save template");
        return;
      }
      toast.success(editing ? "Template updated" : "Template created");
      closeDialog();
      router.refresh();
    });
  }

  function handleDelete(t: TemplateItem) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    const fd = new FormData();
    fd.set("id", t.id);
    startTransition(async () => {
      await deleteTemplateAction(fd);
      toast.success("Template deleted");
      router.refresh();
    });
  }

  function handleFavorite(t: TemplateItem) {
    const fd = new FormData();
    fd.set("id", t.id);
    startTransition(async () => {
      await toggleTemplateFavoriteAction(fd);
      router.refresh();
    });
  }

  function handleSeedSamples() {
    startTransition(async () => {
      const result = await seedSampleTemplatesAction();
      if (result.ok) {
        toast.success(
          result.created > 0
            ? `Added ${result.created} sample template${result.created === 1 ? "" : "s"}`
            : (result.message ?? "Samples already on your account"),
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {PERSONALIZATION_HINT}
        </p>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2 h-11"
            onClick={handleSeedSamples}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LayoutTemplate className="h-4 w-4" />
            )}
            Add 10 samples
          </Button>
          <Button type="button" className="rounded-xl gap-2 h-11" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New template
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-6 py-14 text-center space-y-4">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-60" />
          <div>
            <p className="font-semibold">No templates yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Create your own or load 10 ready-made samples with personalization placeholders.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={handleSeedSamples}>
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Load sample templates
            </Button>
            <Button type="button" className="rounded-xl" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create template
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((t) => (
            <article
              key={t.id}
              className={cn(
                "rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col overflow-hidden",
                t.isFavorite && "ring-1 ring-primary/25",
              )}
            >
              <div className="p-5 sm:p-6 flex-1 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate flex items-center gap-1.5">
                      {t.isFavorite ? (
                        <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                      ) : null}
                      {t.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(t.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFavorite(t)}>
                        <Star className="h-4 w-4" />
                        {t.isFavorite ? "Remove favorite" : "Favorite"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(t)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed flex-1">
                  {t.content}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg h-9"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Link
                    href={`/dashboard/send?template=${t.id}`}
                    className="inline-flex items-center justify-center rounded-lg h-9 px-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Use in Send
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Write your message with placeholders — preview updates live with sample data.
            </DialogDescription>
          </DialogHeader>
          <TemplateEditor
            name={name}
            content={content}
            onNameChange={setName}
            onContentChange={setContent}
            onInsertVariable={handleInsertVariable}
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-xl h-11" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl h-11 min-w-[140px]"
              disabled={pending || !name.trim() || !content.trim()}
              onClick={handleSave}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Create template"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
