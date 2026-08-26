import Link from "next/link";
import {
  adminSendSmartFormReportAction,
  memberSendSmartFormReportAction,
} from "@/lib/actions/smart-form-report";
import { EmailPdfReportButton } from "@/components/admin/email-pdf-report-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatReportCount, formatReportDateTime } from "@/lib/reports/format";
import {
  FORM_REPORT_PERIODS,
  type SmartFormReport,
} from "@/lib/smart-forms/report";
import { Download } from "lucide-react";

const PERIOD_LABEL: Record<(typeof FORM_REPORT_PERIODS)[number], string> = {
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
};

export function SmartFormReportView({
  report,
  emailHtml,
  emailSubject,
  periodBasePath,
  downloadHref,
  scope,
  flash,
}: {
  report: SmartFormReport;
  emailHtml: string;
  emailSubject: string;
  periodBasePath: string;
  downloadHref: string;
  scope: "admin" | "member";
  flash?: { saved?: string; error?: string; detail?: string };
}) {
  const sendAction = scope === "admin" ? adminSendSmartFormReportAction : memberSendSmartFormReportAction;
  const conversion = `${report.metrics.conversionRate.toFixed(1)}%`;
  const lastSubmission = report.metrics.lastSubmissionAt
    ? formatReportDateTime(new Date(report.metrics.lastSubmissionAt))
    : "—";

  return (
    <div className="space-y-6">
      {flash?.saved ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-800 dark:text-emerald-200">
          Form report emailed with the PDF attached. Preview below is what was sent.
        </p>
      ) : null}
      {flash?.error === "no_email" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 text-sm text-destructive">
          Add an email address before sending this report.
        </p>
      ) : null}
      {flash?.error === "invalid_email" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 text-sm text-destructive">
          That email address is not valid.
        </p>
      ) : null}
      {flash?.error === "email" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 text-sm text-destructive">
          Could not send email{flash.detail ? `: ${flash.detail}` : "."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {FORM_REPORT_PERIODS.map((period) => (
          <Link
            key={period}
            href={`${periodBasePath}?period=${period}`}
            className={cn(
              buttonVariants({ variant: period === report.period ? "default" : "outline", size: "sm" }),
              "h-8 px-3 text-xs",
            )}
          >
            {PERIOD_LABEL[period]}
          </Link>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Views", value: formatReportCount(report.metrics.views) },
          { label: "Submissions", value: formatReportCount(report.metrics.submissions) },
          { label: "Conversion", value: conversion },
          { label: "Contacts", value: formatReportCount(report.metrics.contactsCollected) },
        ].map((stat) => (
          <li key={stat.label} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{stat.value}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Share this report</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Preview the email and PDF first, then send. The PDF of results is attached.
            </p>
            <form action={sendAction} className="mt-4 space-y-4">
              <input type="hidden" name="formId" value={report.form.id} />
              <input type="hidden" name="period" value={report.period} />
              <div className="space-y-1.5">
                <Label htmlFor="form-report-to">Send to</Label>
                <Input
                  id="form-report-to"
                  name="to"
                  type="email"
                  defaultValue={report.owner.email ?? ""}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-report-note">Note (optional)</Label>
                <Textarea
                  id="form-report-note"
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder="Add a short note that appears at the top of the email."
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="sm:flex-1">
                  <EmailPdfReportButton />
                </div>
                <a
                  href={`${downloadHref}${downloadHref.includes("?") ? "&" : "?"}download=1`}
                  className={cn(buttonVariants({ variant: "outline" }), "h-8 w-full gap-1.5 sm:w-auto")}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </form>
            <dl className="mt-5 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="text-right font-medium">{report.owner.fullName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Member ID</dt>
                <dd className="text-right font-mono text-xs">{report.owner.accountId ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Last submission</dt>
                <dd className="text-right tabular-nums">{lastSubmission}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">SMS sent</dt>
                <dd className="text-right tabular-nums">{formatReportCount(report.metrics.smsSent)}</dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
              <h2 className="text-sm font-semibold">Results preview</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatReportCount(report.responseTotal)} submission
                {report.responseTotal === 1 ? "" : "s"} in this period
              </p>
            </div>
            {report.responses.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No submissions in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">When</th>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Contact</th>
                      <th className="px-4 py-2.5">Answers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.responses.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                          {formatReportDateTime(new Date(row.submittedAt))}
                        </td>
                        <td className="px-4 py-2.5 font-medium">{row.name || "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {[row.phone, row.email].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground">
                          {row.summary || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/15 px-5 py-4">
              <h2 className="text-sm font-semibold">Email preview</h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{emailSubject}</p>
            </div>
            <iframe
              title="Email preview"
              srcDoc={emailHtml}
              className="h-[520px] w-full bg-[#f4f4f5]"
            />
          </section>
          <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-muted/15 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">PDF preview</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Same file that is emailed</p>
              </div>
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
              >
                Open
              </a>
            </div>
            <iframe title="PDF preview" src={downloadHref} className="h-[520px] w-full bg-muted/20" />
          </section>
        </div>
      </div>
    </div>
  );
}
