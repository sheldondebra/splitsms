"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Megaphone,
  Pencil,
  Send,
  LayoutTemplate,
  History,
  Users,
  ChevronRight,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import { AdminEmailMarketingChart } from "@/components/admin/admin-email-marketing-chart";
import { AdminEmailMarketingSubscribers } from "@/components/admin/admin-email-marketing-subscribers";
import { EmailMarketingImageField } from "@/components/admin/email-marketing-image-field";
import { EmailBodyRichTextEditor } from "@/components/admin/email-body-rich-text-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmailMarketingDashboard } from "@/lib/admin/email-marketing-dashboard";
import {
  adminCreateEmailMarketingTemplateAction,
  adminDeleteEmailMarketingTemplateAction,
  adminSendEmailMarketingAction,
  adminUpdateEmailMarketingTemplateAction,
} from "@/lib/actions/admin-email-marketing";
import type { EmailMarketingAudienceType } from "@/lib/admin/email-marketing-shared";
import { marketingEmailContentPreview } from "@/lib/admin/email-marketing-content";
import { EmailAutomationsForm } from "@/components/admin/email-automations-form";
import type { EmailAutomationSettings } from "@/lib/email/automation-settings";

const TABS = [
  { id: "overview", label: "Overview", icon: Megaphone },
  { id: "compose", label: "Compose", icon: Send },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "history", label: "History", icon: History },
  { id: "automations", label: "Automations", icon: Zap },
] as const;

type TemplateRow = EmailMarketingDashboard["templates"][number];

function flashMessage(flash: {
  saved?: string;
  error?: string;
  count?: string;
  failed?: string;
}) {
  if (flash.saved === "sent") {
    return {
      tone: "ok" as const,
      text: `Campaign sent: ${flash.count ?? 0} delivered${flash.failed && flash.failed !== "0" ? `, ${flash.failed} failed` : ""}.`,
    };
  }
  if (flash.saved === "template") {
    return { tone: "ok" as const, text: "Template saved." };
  }
  if (flash.saved === "template_created") {
    return { tone: "ok" as const, text: "Template created." };
  }
  if (flash.saved === "template_deleted") {
    return { tone: "ok" as const, text: "Template deleted." };
  }
  if (flash.saved === "subscribers") {
    return {
      tone: "ok" as const,
      text: `Added ${flash.count ?? 0} subscriber(s) to the newsletter list.`,
    };
  }
  if (flash.saved === "subscriber") {
    return { tone: "ok" as const, text: "Subscriber updated." };
  }
  if (flash.saved === "subscriber_deleted") {
    return { tone: "ok" as const, text: "Subscriber removed." };
  }
  if (flash.saved === "automations") {
    return { tone: "ok" as const, text: "Email automations saved." };
  }
  if (flash.error === "marketing_fields") {
    return { tone: "err" as const, text: "Subject, headline, and body are required." };
  }
  if (flash.error === "marketing_audience") {
    return { tone: "err" as const, text: "No recipients matched that audience." };
  }
  if (flash.error === "marketing_template") {
    return { tone: "err" as const, text: "Template could not be updated." };
  }
  if (flash.error === "marketing_subscribers") {
    return { tone: "err" as const, text: "Could not update the newsletter list." };
  }
  if (flash.error === "marketing_image") {
    return { tone: "err" as const, text: "Image upload failed. Use PNG, JPG, WEBP, or GIF under 2 MB." };
  }
  return null;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    SENT: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    PARTIAL: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    FAILED: "bg-destructive/10 text-destructive",
    SENDING: "bg-primary/10 text-primary",
    DRAFT: "bg-muted text-muted-foreground",
    sent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    failed: "bg-destructive/10 text-destructive",
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    SENT: "Sent",
    PARTIAL: "Partial",
    FAILED: "Failed",
    SENDING: "Sending",
    DRAFT: "Draft",
    sent: "Sent",
    failed: "Failed",
  };
  return map[status] ?? status;
}

function audienceLabel(type: string) {
  const map: Record<string, string> = {
    all: "All members",
    inactive: "Inactive",
    role_member: "Members",
    role_reseller: "Resellers",
    role_enterprise: "Enterprise",
    newsletter: "Newsletter",
    manual: "Custom emails",
  };
  return map[type] ?? type;
}

type CampaignRow = EmailMarketingDashboard["campaigns"][number];

function CampaignsTable({
  campaigns,
  selectedId,
  showAudience,
  showSender,
}: {
  campaigns: CampaignRow[];
  selectedId?: string | null;
  showAudience?: boolean;
  showSender?: boolean;
}) {
  return (
    <div className="-mx-5 -mb-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/30">
          <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-2.5 font-semibold">Campaign</th>
            {showAudience ? <th className="px-3 py-2.5 font-semibold">Audience</th> : null}
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 font-semibold">Results</th>
            {showSender ? <th className="px-3 py-2.5 font-semibold">Sent by</th> : null}
            <th className="px-5 py-2.5 font-semibold">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => {
            const selected = selectedId === campaign.id;
            const createdAt = new Date(campaign.createdAt);
            return (
              <tr
                key={campaign.id}
                className={cn(
                  "border-t border-border/40 hover:bg-muted/25",
                  selected && "bg-primary/[0.04]",
                )}
              >
                <td className="max-w-[22rem] px-5 py-3">
                  <Link
                    href={`/admin/email-marketing?tab=history&campaignId=${campaign.id}`}
                    className="font-medium hover:underline"
                  >
                    {campaign.name || campaign.subject}
                  </Link>
                  {campaign.name ? (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {campaign.subject}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {Number.isNaN(createdAt.getTime())
                      ? "—"
                      : format(createdAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </td>
                {showAudience ? (
                  <td className="px-3 py-3">
                    <span className="inline-flex h-5 items-center rounded-full border border-border/70 px-2 text-[11px] font-medium text-muted-foreground">
                      {audienceLabel(campaign.audienceType)}
                    </span>
                  </td>
                ) : null}
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold",
                      statusBadge(campaign.status),
                    )}
                  >
                    {statusLabel(campaign.status)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="tabular-nums font-medium">{campaign.sentCount} sent</p>
                  <p
                    className={cn(
                      "text-[11px] tabular-nums",
                      campaign.failedCount > 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {campaign.failedCount} failed
                    {campaign.recipientCount > 0
                      ? ` · ${campaign.recipientCount} total`
                      : ""}
                  </p>
                </td>
                {showSender ? (
                  <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                    {campaign.createdBy?.fullName ?? "—"}
                  </td>
                ) : null}
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/email-marketing?tab=history&campaignId=${campaign.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`View deliveries for ${campaign.name || campaign.subject}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ComposePanel({
  data,
  initialTemplateId,
  branding,
}: {
  data: EmailMarketingDashboard;
  initialTemplateId?: string;
  branding: {
    headerImageUrl: string;
    headerImagePosition: "above" | "below";
  };
}) {
  const initial =
    data.templates.find((t) => t.id === initialTemplateId) ??
    data.templates.find((t) => t.slug === "bulk-sms") ??
    data.templates[0];

  const [templateId, setTemplateId] = useState(initial?.id ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [preheader, setPreheader] = useState(initial?.preheader ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [bodyText, setBodyText] = useState(initial?.bodyText ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "");
  const [ctaHref, setCtaHref] = useState(initial?.ctaHref ?? "");
  const [footerNote, setFooterNote] = useState(initial?.footerNote ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [campaignName, setCampaignName] = useState("");
  const [audienceType, setAudienceType] = useState<EmailMarketingAudienceType>("all");
  const [inactiveDays, setInactiveDays] = useState(String(data.inactiveDaysDefault));
  const [manualEmails, setManualEmails] = useState("");

  function applyTemplate(id: string) {
    const t = data.templates.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(t.id);
    setSubject(t.subject);
    setPreheader(t.preheader ?? "");
    setHeadline(t.headline);
    setBodyText(t.bodyText);
    setCtaLabel(t.ctaLabel ?? "");
    setCtaHref(t.ctaHref ?? "");
    setFooterNote(t.footerNote ?? "");
    setImageUrl(t.imageUrl ?? "");
    if (t.slug === "inactive-reengagement") setAudienceType("inactive");
    if (t.slug.startsWith("newsletter")) setAudienceType("newsletter");
  }

  const previewHtml = useMemo(() => {
    try {
      return marketingEmailContentPreview({
        recipientName: "Alex Mensah",
        subject,
        preheader,
        headline,
        bodyText,
        ctaLabel,
        ctaHref,
        footerNote,
        headerImageUrl: imageUrl || branding.headerImageUrl || undefined,
        headerImagePosition: branding.headerImagePosition,
      }).html;
    } catch {
      return "";
    }
  }, [
    subject,
    preheader,
    headline,
    bodyText,
    ctaLabel,
    ctaHref,
    footerNote,
    imageUrl,
    branding.headerImageUrl,
    branding.headerImagePosition,
  ]);

  const audienceHint =
    audienceType === "manual"
      ? "Paste one or more emails (comma or newline)."
      : audienceType === "inactive"
        ? `~${data.audienceCounts.inactive} inactive members (cap ${data.maxRecipients})`
        : audienceType === "newsletter"
          ? `~${data.audienceCounts.newsletter} newsletter subscribers (cap ${data.newsletterMaxRecipients})`
          : `~${data.audienceCounts[audienceType as keyof typeof data.audienceCounts] ?? 0} recipients (cap ${data.maxRecipients})`;

  return (
    <form action={adminSendEmailMarketingAction} className="grid gap-6 lg:grid-cols-2">
      <input type="hidden" name="returnTo" value="/admin/email-marketing?tab=compose" />
      <input type="hidden" name="templateId" value={templateId} />

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Template</Label>
          <div className="flex flex-wrap gap-2">
            {data.templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  templateId === t.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="campaignName">Campaign name (optional)</Label>
            <Input
              id="campaignName"
              name="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="March feature push"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="preheader">Preheader</Label>
            <Input
              id="preheader"
              name="preheader"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              name="headline"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bodyText">Body</Label>
            <EmailBodyRichTextEditor
              key={templateId}
              name="bodyText"
              defaultValue={bodyText}
              onChange={setBodyText}
            />
            <p className="text-[11px] text-muted-foreground">
              Merge tags: {"{{firstName}}"}, {"{{fullName}}"}, {"{{siteName}}"}, {"{{siteUrl}}"}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaLabel">CTA label</Label>
            <Input
              id="ctaLabel"
              name="ctaLabel"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaHref">CTA link</Label>
            <Input
              id="ctaHref"
              name="ctaHref"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
              placeholder="/dashboard or https://…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="footerNote">Footer note</Label>
            <Input
              id="footerNote"
              name="footerNote"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
            />
          </div>
          <EmailMarketingImageField value={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Audience</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["all", "All members with email"],
                ["inactive", "Inactive members"],
                ["role_member", "Members only"],
                ["role_reseller", "Resellers"],
                ["role_enterprise", "Enterprise"],
                ["newsletter", "Newsletter list"],
                ["manual", "Manual emails"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                  audienceType === value
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-background",
                )}
              >
                <input
                  type="radio"
                  name="audienceType"
                  value={value}
                  checked={audienceType === value}
                  onChange={() => setAudienceType(value)}
                  className="accent-[var(--primary)]"
                />
                {label}
              </label>
            ))}
          </div>
          {audienceType === "inactive" && (
            <div className="space-y-1.5">
              <Label htmlFor="inactiveDays">Inactive for (days)</Label>
              <Input
                id="inactiveDays"
                name="inactiveDays"
                type="number"
                min={1}
                value={inactiveDays}
                onChange={(e) => setInactiveDays(e.target.value)}
                className="max-w-[140px]"
              />
            </div>
          )}
          {audienceType === "manual" && (
            <div className="space-y-1.5">
              <Label htmlFor="manualEmails">Email addresses</Label>
              <Textarea
                id="manualEmails"
                name="manualEmails"
                rows={4}
                value={manualEmails}
                onChange={(e) => setManualEmails(e.target.value)}
                placeholder={"prospect@company.com\npartner@agency.com"}
              />
            </div>
          )}
          {audienceType !== "manual" && (
            <input type="hidden" name="manualEmails" value="" />
          )}
          {audienceType !== "inactive" && (
            <input type="hidden" name="inactiveDays" value={String(data.inactiveDaysDefault)} />
          )}
          <p className="text-xs text-muted-foreground">{audienceHint}</p>
        </div>

        <Button type="submit" className="w-full sm:w-auto">
          <Send className="h-4 w-4" />
          Send campaign
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Live preview</Label>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-zinc-100 dark:bg-zinc-900">
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="h-[720px] w-full bg-white"
            sandbox=""
          />
        </div>
      </div>
    </form>
  );
}

function TemplatesPanel({
  templates,
  focusId,
}: {
  templates: TemplateRow[];
  focusId?: string;
}) {
  const [selectedId, setSelectedId] = useState(
    focusId && templates.some((t) => t.id === focusId)
      ? focusId
      : templates[0]?.id ?? "",
  );
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  if (!selected) {
    return <p className="text-sm text-muted-foreground">No templates yet.</p>;
  }

  return (
    <div className="space-y-6">
      <form
        action={adminCreateEmailMarketingTemplateAction}
        className="space-y-3 rounded-xl border border-border/60 bg-card p-5"
      >
        <h3 className="font-semibold">New template</h3>
        <p className="text-sm text-muted-foreground">
          Create a custom campaign template. System templates stay in the list and can be edited but not deleted.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-name">Name</Label>
            <Input id="create-name" name="name" required placeholder="April product note" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-description">Description</Label>
            <Input id="create-description" name="description" placeholder="Optional" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-subject">Subject</Label>
            <Input id="create-subject" name="subject" required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-preheader">Preheader</Label>
            <Input id="create-preheader" name="preheader" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-headline">Headline</Label>
            <Input id="create-headline" name="headline" required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-bodyText">Body</Label>
            <EmailBodyRichTextEditor id="create-bodyText" name="bodyText" defaultValue="" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-ctaLabel">CTA label</Label>
            <Input id="create-ctaLabel" name="ctaLabel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-ctaHref">CTA link</Label>
            <Input id="create-ctaHref" name="ctaHref" placeholder="/dashboard" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="create-footerNote">Footer note</Label>
            <Input id="create-footerNote" name="footerNote" />
          </div>
          <EmailMarketingImageField id="create-imageUrl" value="" />
        </div>
        <Button type="submit">Create template</Button>
      </form>

    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="space-y-1">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedId(t.id)}
            className={cn(
              "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              selectedId === t.id
                ? "bg-primary/10 text-foreground font-medium"
                : "hover:bg-muted/60 text-muted-foreground",
            )}
          >
            <span className="block">{t.name}</span>
            <span className="block text-[11px] opacity-70 capitalize">{t.category}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
      <form
        key={selected.id}
        action={adminUpdateEmailMarketingTemplateAction}
        className="space-y-4 rounded-xl border border-border/60 bg-card p-5"
      >
        <input type="hidden" name="returnTo" value="/admin/email-marketing?tab=templates" />
        <input type="hidden" name="templateId" value={selected.id} />
        <div className="flex items-center gap-2 pb-1">
          <Pencil className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Edit template</h3>
          {selected.isSystem && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              System
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={selected.name} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={selected.description ?? ""} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" defaultValue={selected.subject} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="preheader">Preheader</Label>
            <Input id="preheader" name="preheader" defaultValue={selected.preheader ?? ""} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" name="headline" defaultValue={selected.headline} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bodyText">Body</Label>
            <EmailBodyRichTextEditor id="bodyText" name="bodyText" defaultValue={selected.bodyText} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaLabel">CTA label</Label>
            <Input id="ctaLabel" name="ctaLabel" defaultValue={selected.ctaLabel ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaHref">CTA link</Label>
            <Input id="ctaHref" name="ctaHref" defaultValue={selected.ctaHref ?? ""} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="footerNote">Footer note</Label>
            <Input id="footerNote" name="footerNote" defaultValue={selected.footerNote ?? ""} />
          </div>
          <EmailMarketingImageField id="edit-imageUrl" value={selected.imageUrl ?? ""} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save template</Button>
          <Link
            href={`/admin/email-marketing?tab=compose&templateId=${selected.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Use in compose
          </Link>
        </div>
      </form>
      {!selected.isSystem ? (
        <form
          action={adminDeleteEmailMarketingTemplateAction}
          onSubmit={(e) => {
            if (!confirm("Delete this template?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="templateId" value={selected.id} />
          <Button type="submit" variant="destructive">
            Delete template
          </Button>
        </form>
      ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminEmailMarketingView({
  data,
  flash,
  templateId,
  branding,
  automations,
}: {
  data: EmailMarketingDashboard;
  flash: {
    saved?: string;
    error?: string;
    count?: string;
    failed?: string;
  };
  templateId?: string;
  branding: {
    headerImageUrl: string;
    headerImagePosition: "above" | "below";
  };
  automations: EmailAutomationSettings;
}) {
  const notice = flashMessage(flash);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Email Marketing"
        description="Send branded feature campaigns to members, newsletter subscribers, or pasted emails. Templates include SmartForms, Reseller, Bulk SMS, WordPress, and newsletter automations."
        icon={Mail}
        actions={
          <Link href="/admin/email-marketing?tab=compose" className={buttonVariants()}>
            <Send className="h-4 w-4" />
            New campaign
          </Link>
        }
      />

      {notice && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {notice.text}
        </div>
      )}

      <nav
        aria-label="Email marketing"
        className="flex gap-1 overflow-x-auto border-b border-border app-scroll-x"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = data.tab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/email-marketing?tab=${tab.id}`}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 px-3 pb-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {data.tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Campaigns"
              value={data.stats.campaignCount}
              icon={Megaphone}
            />
            <AdminStatCard
              label="Emails sent"
              value={data.stats.emailsSent}
              icon={Send}
              variant="primary"
            />
            <AdminStatCard
              label="Failed"
              value={data.stats.emailsFailed}
              icon={Mail}
              variant={data.stats.emailsFailed > 0 ? "danger" : "default"}
            />
            <AdminStatCard
              label="Success rate"
              value={
                data.stats.successRate === null ? "—" : `${data.stats.successRate}%`
              }
              hint="Based on recorded deliveries"
            />
          </div>

          <AdminCard title="Sends (14 days)">
            <AdminEmailMarketingChart data={data.chart} />
          </AdminCard>

          <AdminCard title="Audience snapshot">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["All with email", data.audienceCounts.all],
                  ["Inactive", data.audienceCounts.inactive],
                  ["Members", data.audienceCounts.role_member],
                  ["Resellers", data.audienceCounts.role_reseller],
                  ["Enterprise", data.audienceCounts.role_enterprise],
                  ["Newsletter", data.audienceCounts.newsletter],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-card px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Recent campaigns"
            actions={
              <Link
                href="/admin/email-marketing?tab=history"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View all
              </Link>
            }
          >
            {data.campaigns.length === 0 ? (
              <AdminEmpty dense>No campaigns yet. Compose your first feature email.</AdminEmpty>
            ) : (
              <CampaignsTable campaigns={data.campaigns.slice(0, 8)} />
            )}
          </AdminCard>
        </div>
      )}

      {data.tab === "compose" && (
        <AdminCard title="Compose campaign">
          <ComposePanel
            data={data}
            initialTemplateId={templateId}
            branding={branding}
          />
        </AdminCard>
      )}

      {data.tab === "templates" && (
        <AdminCard title="Email templates">
          <TemplatesPanel templates={data.templates} focusId={templateId} />
        </AdminCard>
      )}

      {data.tab === "subscribers" && (
        <AdminCard title="Newsletter list">
          <AdminEmailMarketingSubscribers
            subscribers={data.subscribers}
            count={data.subscriberCount}
          />
        </AdminCard>
      )}

      {data.tab === "automations" && <EmailAutomationsForm settings={automations} />}

      {data.tab === "history" && (
        <div className="space-y-6">
          <AdminCard
            title="Campaign history"
            description="Open a campaign to inspect each recipient."
            actions={
              <span className="text-xs tabular-nums text-muted-foreground">
                {data.campaigns.length} {data.campaigns.length === 1 ? "campaign" : "campaigns"}
              </span>
            }
          >
            {data.campaigns.length === 0 ? (
              <AdminEmpty dense>No send history yet.</AdminEmpty>
            ) : (
              <CampaignsTable
                campaigns={data.campaigns}
                selectedId={data.selectedCampaign?.id}
                showAudience
                showSender
              />
            )}
          </AdminCard>

          {data.selectedCampaign && (
            <AdminCard
              title="Deliveries"
              description={data.selectedCampaign.subject}
            >
              {data.selectedCampaign.deliveries.length === 0 ? (
                <AdminEmpty dense>No delivery rows for this campaign.</AdminEmpty>
              ) : (
                <div className="-mx-5 -mb-5 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-muted/30">
                      <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-2.5 font-semibold">Recipient</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-5 py-2.5 font-semibold">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.selectedCampaign.deliveries.map((delivery) => {
                        const sentAt = delivery.sentAt
                          ? new Date(delivery.sentAt)
                          : null;
                        return (
                          <tr
                            key={delivery.id}
                            className="border-t border-border/40 hover:bg-muted/25"
                          >
                            <td className="px-5 py-3">
                              <p className="font-medium">
                                {delivery.fullName || "—"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {delivery.email}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold",
                                  statusBadge(delivery.status),
                                )}
                              >
                                {statusLabel(delivery.status)}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-muted-foreground">
                              {delivery.error ||
                                (sentAt && !Number.isNaN(sentAt.getTime())
                                  ? format(sentAt, "MMM d, yyyy · h:mm a")
                                  : "—")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminCard>
          )}
        </div>
      )}
    </AdminPage>
  );
}
