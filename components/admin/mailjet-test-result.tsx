import type { GatewayLastTest } from "@/lib/payments/gateway-settings";

function detailText(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  if (value == null || value === "") return null;
  return String(value);
}

export function MailjetTestResult({
  title,
  lastTest,
}: {
  title: string;
  lastTest: GatewayLastTest | null;
}) {
  if (!lastTest) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        {title} — not run yet
      </div>
    );
  }

  const details =
    lastTest.details && typeof lastTest.details === "object"
      ? (lastTest.details as Record<string, unknown>)
      : null;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs ${
        lastTest.ok
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <span
          className={
            lastTest.ok
              ? "text-emerald-700 dark:text-emerald-300 font-medium"
              : "text-destructive font-medium"
          }
        >
          {lastTest.ok ? "Passed" : "Failed"}
        </span>
      </div>

      {lastTest.at && (
        <p className="text-muted-foreground mt-1">
          {new Date(lastTest.at).toLocaleString()}
        </p>
      )}

      {!lastTest.ok && lastTest.error && (
        <p className="text-destructive mt-2 leading-relaxed">{lastTest.error}</p>
      )}

      {lastTest.ok && details && (
        <dl className="mt-3 space-y-1.5">
          {detailText(details, "fromEmail") && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">From</dt>
              <dd className="font-mono break-all">{detailText(details, "fromEmail")}</dd>
            </div>
          )}
          {detailText(details, "fromName") && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Name</dt>
              <dd>{detailText(details, "fromName")}</dd>
            </div>
          )}
          {detailText(details, "to") && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">To</dt>
              <dd className="font-mono break-all">{detailText(details, "to")}</dd>
            </div>
          )}
          {details.sandbox != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Sandbox</dt>
              <dd>{details.sandbox ? "On" : "Off"}</dd>
            </div>
          )}
          {detailText(details, "messageId") && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Message ID</dt>
              <dd className="font-mono break-all">{detailText(details, "messageId")}</dd>
            </div>
          )}
          {detailText(details, "domainStatus") && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Domain</dt>
              <dd className="font-mono break-all">
                {detailText(details, "domainStatus")}
              </dd>
            </div>
          )}
          {detailText(details, "provider") && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Provider</dt>
              <dd>{detailText(details, "provider")}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
