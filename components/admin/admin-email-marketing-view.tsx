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
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
} from "@/components/admin/admin-page-shell";
import { AdminEmailMarketingChart } from "@/components/admin/admin-email-marketing-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmailMarketingDashboard } from "@/lib/admin/email-marketing-dashboard";
import {
  adminSendEmailMarketingAction,
  adminUpdateEmailMarketingTemplateAction,
} from "@/lib/actions/admin-email-marketing";
import type { EmailMarketingAudienceType } from "@/lib/admin/email-marketing-shared";
import { marketingEmailContent } from "@/lib/admin/email-marketing-content";

const TABS = [
  { id: "overview", label: "Overview", icon: Megaphone },
  { id: "compose", label: "Compose", icon: Send },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "history", label: "History", icon: History },
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
  if (flash.error === "marketing_fields") {
    return { tone: "err" as const, text: "Subject, headline, and body are required." };
  }
  if (flash.error === "marketing_audience") {
    return { tone: "err" as const, text: "No recipients matched that audience." };
  }
  if (flash.error === "marketing_template") {
    return { tone: "err" as const, text: "Template could not be updated." };
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
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

function ComposePanel({
  data,
  initialTemplateId,
}: {
  data: EmailMarketingDashboard;
  initialTemplateId?: string;
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
    if (t.slug === "inactive-reengagement") setAudienceType("inactive");
  }

  const previewHtml = useMemo(() => {
    try {
      return marketingEmailContent({
        recipientName: "Alex Mensah",
        subject,
        preheader,
        headline,
        bodyText,
        ctaLabel,
        ctaHref,
        footerNote,
      }).html;
    } catch {
      return "";
    }
  }, [subject, preheader, headline, bodyText, ctaLabel, ctaHref, footerNote]);

  const audienceHint =
    audienceType === "manual"
      ? "Paste one or more emails (comma or newline)."
      : audienceType === "inactive"
        ? `~${data.audienceCounts.inactive} inactive members (cap ${data.maxRecipients})`
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
            <Textarea
              id="bodyText"
              name="bodyText"
              required
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="font-sans text-sm"
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
            <Textarea id="bodyText" name="bodyText" rows={8} defaultValue={selected.bodyText} required />
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
    </div>
  );
}

export function AdminEmailMarketingView({
  data,
  flash,
  templateId,
}: {
  data: EmailMarketingDashboard;
  flash: {
    saved?: string;
    error?: string;
    count?: string;
    failed?: string;
  };
  templateId?: string;
}) {
  const notice = flashMessage(flash);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Email Marketing"
        description="Send branded feature campaigns to members or custom emails. Templates include SmartForms, Reseller, Bulk SMS, and WordPress."
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

      <div className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = data.tab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/email-marketing?tab=${tab.id}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(
                [
                  ["All with email", data.audienceCounts.all],
                  ["Inactive", data.audienceCounts.inactive],
                  ["Members", data.audienceCounts.role_member],
                  ["Resellers", data.audienceCounts.role_reseller],
                  ["Enterprise", data.audienceCounts.role_enterprise],
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
              <p className="text-sm text-muted-foreground py-8 text-center">
                No campaigns yet. Compose your first feature email.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Campaign</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Sent</th>
                      <th className="py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.slice(0, 8).map((c) => (
                      <tr key={c.id} className="border-b border-border/40">
                        <td className="py-2.5 pr-3">
                          <Link
                            href={`/admin/email-marketing?tab=history&campaignId=${c.id}`}
                            className="font-medium hover:underline"
                          >
                            {c.name || c.subject}
                          </Link>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                            {c.template?.name ?? "Custom"} · {c.audienceType}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              statusBadge(c.status),
                            )}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {c.sentCount}/{c.recipientCount}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>
      )}

      {data.tab === "compose" && (
        <AdminCard title="Compose campaign">
          <ComposePanel data={data} initialTemplateId={templateId} />
        </AdminCard>
      )}

      {data.tab === "templates" && (
        <AdminCard title="Email templates">
          <TemplatesPanel templates={data.templates} focusId={templateId} />
        </AdminCard>
      )}

      {data.tab === "history" && (
        <div className="space-y-6">
          <AdminCard title="Campaign history">
            {data.campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No send history yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Campaign</th>
                      <th className="py-2 pr-3 font-medium">Audience</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Results</th>
                      <th className="py-2 font-medium">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border/40">
                        <td className="py-2.5 pr-3">
                          <Link
                            href={`/admin/email-marketing?tab=history&campaignId=${c.id}`}
                            className="font-medium hover:underline"
                          >
                            {c.name || c.subject}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{c.audienceType}</td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              statusBadge(c.status),
                            )}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {c.sentCount} sent · {c.failedCount} failed
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {c.createdBy?.fullName ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          {data.selectedCampaign && (
            <AdminCard title={`Deliveries · ${data.selectedCampaign.name || data.selectedCampaign.subject}`}>
              <div className="mb-3 text-xs text-muted-foreground">
                Subject: {data.selectedCampaign.subject}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Recipient</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.selectedCampaign.deliveries.map((d) => (
                      <tr key={d.id} className="border-b border-border/40">
                        <td className="py-2 pr-3">
                          <span className="font-medium">{d.fullName ?? "—"}</span>
                          <p className="text-[11px] text-muted-foreground">{d.email}</p>
                        </td>
                        <td className="py-2 pr-3 capitalize">{d.status}</td>
                        <td className="py-2 text-muted-foreground text-xs">
                          {d.error || (d.sentAt ? new Date(d.sentAt).toLocaleString() : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          )}
        </div>
      )}
    </AdminPage>
  );
}
