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
import {
  TEMPLATE_VARIABLES,
  PERSONALIZATION_HINT,
  extractTemplateVariables,
} from "@/lib/sms/personalize";
import { getMessagePreview } from "@/lib/sms/message-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  FileStack,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export type TemplateItem = {
  id: string;
  name: string;
  content: string;
  isFavorite: boolean;
  updatedAt: string;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
] as const;

function insertVariable(content: string, key: string) {
  const token = `{${key}}`;
  return content ? `${content}${content.endsWith(" ") ? "" : " "}${token}` : token;
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="tpl-name">Template name</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Welcome message"
            className="h-11 rounded-xl text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tpl-content">Message</Label>
          <Textarea
            id="tpl-content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={7}
            placeholder="Hi {firstName}, thanks for joining!"
            className="min-h-[160px] resize-y rounded-xl text-base"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">{PERSONALIZATION_HINT}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Insert placeholder</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => onInsertVariable(v.key)}
                className="h-8 rounded-lg border border-border/70 bg-background px-2.5 font-mono text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                {`{${v.key}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <SmsPreview message={content} compact showVariableHints />
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const empty = initial.length === 0;
  const favorites = initial.filter((t) => t.isFavorite).length;
  const withPlaceholders = initial.filter(
    (t) => extractTemplateVariables(t.content).length > 0,
  ).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...initial]
      .filter((t) => (filter === "favorites" ? t.isFavorite : true))
      .filter((t) => {
        if (!q) return true;
        return t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [initial, query, filter]);

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
      const result = editing ? await updateTemplateAction(fd) : await createTemplateAction(fd);
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
    if (!window.confirm(`Delete “${t.name}”? This cannot be undone.`)) return;
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
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                empty
                  ? "bg-primary/10 text-primary ring-primary/15"
                  : favorites > 0
                    ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                    : "bg-primary/10 text-primary ring-primary/15",
              )}
            >
              {favorites > 0 && !empty ? (
                <Star className="h-4 w-4 fill-current" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {empty
                  ? "Create your first SMS template"
                  : `${initial.length.toLocaleString()} template${initial.length === 1 ? "" : "s"} ready`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {empty
                  ? "Save messages you reuse, with {firstName} and other placeholders."
                  : "Use in Send SMS or campaigns — edit anytime."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-xl"
              onClick={handleSeedSamples}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileStack className="h-3.5 w-3.5" />
              )}
              Samples
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 rounded-xl"
              onClick={openCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              New template
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3">
          <div className="border-b border-border/50 bg-primary/[0.03] p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Templates
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-primary sm:text-3xl">
              {initial.length.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Saved messages</p>
          </div>
          <div className="border-b border-border/50 p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/12 text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200">
                <Star className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Favorites
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              {favorites.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Starred for quick access</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60">
                <Send className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Personalized
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              {withPlaceholders.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Use placeholders</p>
          </div>
        </div>
      </div>

      {empty ? (
        <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm">
          <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.10] via-background to-muted/20 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight">Get started</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Create a blank template or load samples for welcome, OTP, delivery, and more.
            </p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <button
              type="button"
              onClick={openCreate}
              className="group rounded-xl border border-primary/30 bg-primary/[0.05] p-4 text-left transition-colors hover:bg-primary/[0.08]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
                <Plus className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-semibold">Create blank template</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Name it, write the message, add placeholders, then save.
              </p>
            </button>
            <button
              type="button"
              onClick={handleSeedSamples}
              disabled={pending}
              className="group rounded-xl border border-border/60 bg-muted/10 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.04] disabled:opacity-60"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileStack className="h-4 w-4" />
                )}
              </span>
              <p className="mt-3 text-sm font-semibold">Load 10 samples</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Ready-made welcome, order, delivery, OTP, and promo messages.
              </p>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:px-4">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </div>
            <div
              role="tablist"
              aria-label="Filter templates"
              className="inline-flex h-10 w-full items-center rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-auto"
            >
              {FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "inline-flex h-full flex-1 items-center justify-center rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none",
                    filter === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                  {opt.value === "favorites" ? (
                    <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">
                      {favorites}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground sm:ml-auto">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {filtered.length}
              </span>{" "}
              of {initial.length}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center">
              <p className="text-sm font-medium">No templates match</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search or clear the Favorites filter.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 h-9 rounded-xl"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => {
                const preview = getMessagePreview(t.content);
                const variables = extractTemplateVariables(t.content);

                return (
                  <article
                    key={t.id}
                    className={cn(
                      "group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-colors hover:border-primary/30",
                      t.isFavorite && "border-primary/25 bg-primary/[0.02]",
                    )}
                  >
                    <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                          t.isFavorite
                            ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                            : "bg-primary/10 text-primary ring-primary/15",
                        )}
                      >
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">{t.name}</h3>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Updated {formatUpdated(t.updatedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFavorite(t)}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          t.isFavorite
                            ? "text-amber-700 hover:bg-amber-500/10 dark:text-amber-200"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        aria-label={t.isFavorite ? `Unfavorite ${t.name}` : `Favorite ${t.name}`}
                      >
                        <Star className={cn("h-4 w-4", t.isFavorite && "fill-current")} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`More actions for ${t.name}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFavorite(t)}>
                            <Star className="h-4 w-4" />
                            {t.isFavorite ? "Remove favorite" : "Favorite"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(t)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
                      <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
                        <p className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                          {t.content}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                          {preview.characters} chars · {preview.segments} SMS
                        </span>
                        {variables.slice(0, 3).map((key) => (
                          <span
                            key={key}
                            className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary"
                          >
                            {`{${key}}`}
                          </span>
                        ))}
                        {variables.length > 3 ? (
                          <span className="text-[11px] text-muted-foreground">
                            +{variables.length - 3}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-4">
                        <Link
                          href={`/dashboard/send?template=${t.id}`}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "h-9 flex-1 gap-1.5 rounded-xl sm:flex-none",
                          )}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Use
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 flex-1 gap-1.5 rounded-xl sm:flex-none"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Write with placeholders — the phone preview updates as you type.
            </DialogDescription>
          </DialogHeader>
          <TemplateEditor
            name={name}
            content={content}
            onNameChange={setName}
            onContentChange={setContent}
            onInsertVariable={handleInsertVariable}
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 min-w-[140px] rounded-xl font-semibold"
              disabled={pending || !name.trim() || !content.trim()}
              onClick={handleSave}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
