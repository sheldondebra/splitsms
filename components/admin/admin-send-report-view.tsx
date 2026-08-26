import { adminSendMemberAccountReportAction } from "@/lib/actions/admin-reports";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminAlert,
  AdminEmpty,
} from "@/components/admin/admin-page-shell";
import {
  ReportPeriodTabs,
  ReportSubnav,
  ADMIN_REPORT_NAV,
} from "@/components/reports/report-nav";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReportMemberSelect } from "@/components/admin/report-member-select";
import { EmailPdfReportButton } from "@/components/admin/email-pdf-report-button";
import {
  SendAllMemberReportsButton,
  type AccountReportRecipient,
} from "@/components/admin/send-all-member-reports-button";
import { CalendarClock, FileBarChart2, Hash, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ReportPeriodDays } from "@/lib/reports/period";
import type { MemberAccountReport } from "@/lib/reports/member-account-report";
import {
  formatDeliveryRate,
  formatReportCount,
  formatReportDate,
  formatReportMoney,
} from "@/lib/reports/format";

const BASE = "/admin/reports";

type MemberOption = { id: string; fullName: string; phone: string; email: string | null };

export function AdminSendReportView({
  period,
  members,
  selectedUserId,
  preview,
  recipientSummary,
  recipients,
  flash,
}: {
  period: ReportPeriodDays;
  members: MemberOption[];
  selectedUserId?: string;
  preview: MemberAccountReport | null;
  recipientSummary: { eligible: number; noEmail: number; inactive: number };
  recipients: AccountReportRecipient[];
  flash?: { saved?: string; error?: string; detail?: string };
}) {
  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Send account report"
        description="Email a PDF account report to one member, or to every active member with an email."
        icon={FileBarChart2}
        actions={
          <ReportPeriodTabs
            basePath={`${BASE}/send`}
            period={period}
            extraQuery={{ userId: selectedUserId }}
          />
        }
      />
      <ReportSubnav base={BASE} current={`${BASE}/send`} items={[...ADMIN_REPORT_NAV]} />

      {flash?.saved && (
        <AdminAlert variant="success">
          Account report PDF emailed to the member. They also received an in-app notification.
        </AdminAlert>
      )}
      {flash?.error === "member" && (
        <AdminAlert variant="destructive">Select a valid member.</AdminAlert>
      )}
      {flash?.error === "no_email" && (
        <AdminAlert variant="destructive">
          That member has no email on file — add an email before sending a PDF report.
        </AdminAlert>
      )}
      {flash?.error === "email" && (
        <AdminAlert variant="destructive">
          Could not send email{flash.detail ? `: ${flash.detail}` : "."} In-app notification may still
          have been created.
        </AdminAlert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard title="Choose member" description="Report covers the selected period">
          <form action={adminSendMemberAccountReportAction} className="space-y-4">
            <input type="hidden" name="days" value={period} />
            <div className="space-y-1.5">
              <Label htmlFor="report-member">Member</Label>
              <ReportMemberSelect
                members={members}
                selectedUserId={selectedUserId}
                period={period}
              />
              {selectedUserId ? (
                <input type="hidden" name="userId" value={selectedUserId} />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Changing the period above reloads the preview. Submit emails the PDF for the current
              period.
            </p>
            <EmailPdfReportButton disabled={!selectedUserId} />
          </form>
          <SelectedMemberDetails preview={preview} selected={Boolean(selectedUserId)} />
        </AdminCard>

        <AdminCard title="Statement preview" description="Same figures that go in the email and PDF">
          {!preview ? (
            <AdminEmpty>Select a member to preview the account statement.</AdminEmpty>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-lg font-semibold tracking-tight">{preview.member.fullName}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {preview.member.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      {preview.member.phone}
                    </span>
                  ) : null}
                  {preview.member.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      {preview.member.email}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    Member ID {preview.member.accountId}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    Last {preview.periodDays} days
                  </span>
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {[
                  { label: "Messages", value: formatReportCount(preview.kpis.messages) },
                  {
                    label: "Delivered",
                    value: formatReportCount(preview.kpis.delivered),
                    hint: `${formatDeliveryRate(preview.kpis.delivered, preview.kpis.messages)} rate`,
                  },
                  { label: "Failed", value: formatReportCount(preview.kpis.failed) },
                  { label: "SMS credits", value: formatReportCount(preview.member.credits) },
                  {
                    label: "Wallet",
                    value: formatReportMoney(
                      preview.member.walletCurrency,
                      preview.member.walletBalance,
                    ),
                  },
                  { label: "Transactions", value: formatReportCount(preview.kpis.transactions) },
                ].map((k) => (
                  <li key={k.label} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {k.label}
                    </span>
                    <span className="mt-0.5 block font-semibold tabular-nums tracking-tight">
                      {k.value}
                    </span>
                    {"hint" in k && k.hint ? (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{k.hint}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {preview.charts.failureReasons.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">Top delivery issues</p>
                  <ul className="space-y-1.5 text-sm">
                    {preview.charts.failureReasons.slice(0, 5).map((r) => (
                      <li key={r.reason} className="flex justify-between gap-3">
                        <span className="truncate text-muted-foreground">{r.reason}</span>
                        <span className="tabular-nums shrink-0 font-medium">
                          {formatReportCount(r.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Email includes this summary plus a branded PDF statement.
              </p>
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard
        title="Send to all members"
        description={`Each active member with an email gets their own last-${period}-day PDF and an in-app notice.`}
        actions={
          <SendAllMemberReportsButton
            period={period}
            eligible={recipientSummary.eligible}
            noEmail={recipientSummary.noEmail}
            inactive={recipientSummary.inactive}
            recipients={recipients}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          {recipientSummary.eligible === 0
            ? "No active members have an email on file yet."
            : `${recipientSummary.eligible} member${recipientSummary.eligible === 1 ? "" : "s"} will be emailed. Suspended and blocked accounts are skipped.`}
        </p>
      </AdminCard>
    </AdminPage>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0">
      <dt className="text-xs text-muted-foreground shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm font-medium text-right min-w-0">{value}</dd>
    </div>
  );
}

function SenderIdPills({ values }: { values: string[] }) {
  const ids = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (ids.length === 0) return <span className="text-muted-foreground">None registered</span>;

  return (
    <span className="inline-flex flex-wrap justify-end gap-1.5">
      {ids.map((id) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          size="sm"
          tabIndex={-1}
          className="h-7 pointer-events-none font-mono text-[11px]"
        >
          {id}
        </Button>
      ))}
    </span>
  );
}

function SelectedMemberDetails({
  preview,
  selected,
}: {
  preview: MemberAccountReport | null;
  selected: boolean;
}) {
  if (!selected) {
    return (
      <p className="mt-5 border-t border-border/50 pt-4 text-sm text-muted-foreground">
        Select a member to see their account details here.
      </p>
    );
  }
  if (!preview) {
    return (
      <p className="mt-5 border-t border-border/50 pt-4 text-sm text-muted-foreground">
        Could not load this member.
      </p>
    );
  }

  const { member, kpis } = preview;
  const deliveryRate = formatDeliveryRate(kpis.delivered, kpis.messages);

  return (
    <div className="mt-5 border-t border-border/50 pt-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight">{member.fullName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last {preview.periodDays} days ·{" "}
            {member.isVerified ? "Verified" : "Not verified"}
          </p>
        </div>
        <Link
          href={`/admin/members/${member.id}`}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          Open member
        </Link>
      </div>
      <dl>
        <DetailRow label="Member ID" value={member.accountId} />
        <DetailRow label="Phone" value={member.phone || "—"} />
        <DetailRow label="Email" value={member.email?.trim() || "No email on file"} />
        <DetailRow label="Country" value={member.countryCode || "—"} />
        <DetailRow label="Joined" value={formatReportDate(member.createdAt)} />
        <DetailRow label="Sender IDs" value={<SenderIdPills values={preview.senderIds} />} />
        <DetailRow label="SMS credits" value={formatReportCount(member.credits)} />
        <DetailRow
          label="Wallet"
          value={formatReportMoney(member.walletCurrency, member.walletBalance)}
        />
        <DetailRow label="Messages" value={formatReportCount(kpis.messages)} />
        <DetailRow label="Delivered" value={`${formatReportCount(kpis.delivered)} (${deliveryRate})`} />
        <DetailRow label="Failed" value={formatReportCount(kpis.failed)} />
        <DetailRow label="Transactions" value={formatReportCount(kpis.transactions)} />
        <DetailRow label="Login events" value={formatReportCount(kpis.logins)} />
      </dl>
    </div>
  );
}
