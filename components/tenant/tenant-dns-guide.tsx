import { normalizeHost } from "@/lib/reseller/tenant-host";

function platformHostname() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (!fromEnv) return "app.splitsms.com";
  try {
    return normalizeHost(new URL(fromEnv).hostname);
  } catch {
    return "app.splitsms.com";
  }
}

export function TenantDnsGuide({
  domain,
  className,
}: {
  domain?: string | null;
  className?: string;
}) {
  const host = platformHostname();
  const target = domain?.trim() ? domain.replace(/^https?:\/\//, "").split("/")[0] : "sms.yourbrand.com";

  return (
    <div className={className ?? "rounded-lg border border-border/60 bg-muted/30 p-4 text-sm space-y-3"}>
      <p className="font-medium text-foreground">Custom domain DNS</p>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Point your branded hostname at SplitSMS so members can sign in on your domain with your logo
        and colors.
      </p>
      <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
        <li>
          Add a <strong className="text-foreground">CNAME</strong> record:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{target}</code> →{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{host}</code>
        </li>
        <li>Wait for DNS propagation (up to 48 hours).</li>
        <li>
          Save the domain here (no <code className="font-mono">https://</code>). Members use{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            https://{target}/login
          </code>
        </li>
      </ol>
      <p className="text-[10px] text-muted-foreground">
        Reseller portal and admin stay on the main platform URL. Clients can sign up on your domain
        via <code className="font-mono">/signup</code>, or you can create accounts from your
        dashboard.
      </p>
    </div>
  );
}
