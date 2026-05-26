import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCard } from "@/components/admin/admin-page-shell";
import type { GatewayConfig, GatewayConfigSource, GatewayLastTest } from "@/lib/payments/gateway-settings";
import { maskSecret } from "@/lib/payments/gateway-settings";

type PaymentGatewayPanelProps = {
  title: string;
  description: string;
  gatewayId: string;
  config: GatewayConfig;
  source: GatewayConfigSource;
  lastTest: GatewayLastTest | null;
  saveAction: (formData: FormData) => Promise<void>;
  testAction: () => Promise<void>;
  currencyPlaceholder: string;
  secretPlaceholder: string;
  publicPlaceholder?: string;
};

function formatTestDetails(details: Record<string, unknown> | null | undefined) {
  if (!details) return null;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export function PaymentGatewayPanel({
  title,
  description,
  gatewayId,
  config,
  source,
  lastTest,
  saveAction,
  testAction,
  currencyPlaceholder,
  secretPlaceholder,
  publicPlaceholder,
}: PaymentGatewayPanelProps) {
  const ready = config.enabled && Boolean(config.secretKey);

  return (
    <AdminCard
      title={title}
      description={description}
      actions={
        <Badge variant={ready ? "default" : "secondary"}>
          {ready ? "Ready" : "Not configured"}
        </Badge>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span>
          Source:{" "}
          <span className="font-medium text-foreground">
            {source === "admin"
              ? "Admin dashboard"
              : source === "environment"
                ? "Environment fallback"
                : "None"}
          </span>
        </span>
        {config.secretKey && (
          <span>
            Secret: <span className="font-mono">{maskSecret(config.secretKey)}</span>
          </span>
        )}
      </div>

      {lastTest && (
        <div
          className={`mb-4 rounded-xl border px-3 py-2.5 text-xs ${
            lastTest.ok
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          <p className="font-medium">
            Last connection test — {lastTest.ok ? "passed" : "failed"}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {new Date(lastTest.at).toLocaleString()}
          </p>
          {lastTest.error && (
            <p className="mt-1 text-amber-700 dark:text-amber-400">{lastTest.error}</p>
          )}
          {lastTest.details && (
            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-muted/40 p-2 font-mono text-[10px] leading-relaxed">
              {formatTestDetails(lastTest.details)}
            </pre>
          )}
        </div>
      )}

      <form action={saveAction} className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={config.enabled} className="rounded" />
          Enable {title} for wallet top-ups
        </label>

        <div className="space-y-2">
          <Label>Secret key</Label>
          <Input
            name="secretKey"
            type="password"
            autoComplete="off"
            placeholder={secretPlaceholder}
            defaultValue=""
          />
          <p className="text-[11px] text-muted-foreground">
            Leave blank to keep the current key
            {config.secretKey ? ` (${maskSecret(config.secretKey)})` : ""}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Public key (optional)</Label>
            <Input
              name="publicKey"
              type="password"
              autoComplete="off"
              placeholder={publicPlaceholder}
              defaultValue=""
            />
            {config.publicKey && (
              <p className="text-[11px] text-muted-foreground font-mono">
                Current: {maskSecret(config.publicKey)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Default currency</Label>
            <Input
              name="defaultCurrency"
              defaultValue={config.defaultCurrency}
              placeholder={currencyPlaceholder}
              className="uppercase font-mono"
              maxLength={3}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Webhook secret (optional)</Label>
          <Input
            name="webhookSecret"
            type="password"
            autoComplete="off"
            placeholder="For verifying provider webhooks"
            defaultValue=""
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save {title}</Button>
        </div>
      </form>

      <form action={testAction} className="mt-3">
        <Button type="submit" variant="outline" size="sm">
          Test connection
        </Button>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Calls the {title} API to verify your secret key and fetch account balance details.
        </p>
        <input type="hidden" name="gateway" value={gatewayId} readOnly />
      </form>
    </AdminCard>
  );
}
