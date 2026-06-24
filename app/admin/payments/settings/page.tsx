import Link from "next/link";
import {
  saveOfflinePaymentDetailsAction,
  savePaystackSettingsAction,
  saveFlutterwaveSettingsAction,
  saveStripeSettingsAction,
  testPaystackConnectionAction,
  testFlutterwaveConnectionAction,
  testStripeConnectionAction,
  saveDefaultPaymentProviderAction,
  setGatewayAsDefaultAction,
} from "@/lib/actions/admin-payment-settings";
import { getOfflineBankDetails } from "@/lib/payments/offline-config";
import {
  loadPaystackSettings,
  loadFlutterwaveSettings,
  loadStripeSettings,
  loadGatewayLastTest,
  getPaymentGatewaysOverview,
  loadDefaultPaymentProvider,
} from "@/lib/payments/gateway-settings";
import { PaymentGatewayPanel } from "@/components/admin/payment-gateway-panel";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft } from "lucide-react";

const GATEWAY_LABELS: Record<string, string> = {
  paystack: "Paystack",
  flutterwave: "Flutterwave",
  stripe: "Stripe",
};

export default async function PaymentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    test?: string;
    result?: string;
    provider?: string;
  }>;
}) {
  const params = await searchParams;

  const [
    details,
    paystack,
    flutterwave,
    stripe,
    overview,
    paystackTest,
    flutterwaveTest,
    stripeTest,
    defaultProvider,
  ] = await Promise.all([
    getOfflineBankDetails(),
    loadPaystackSettings(),
    loadFlutterwaveSettings(),
    loadStripeSettings(),
    getPaymentGatewaysOverview(),
    loadGatewayLastTest("paystack_last_test"),
    loadGatewayLastTest("flutterwave_last_test"),
    loadGatewayLastTest("stripe_last_test"),
    loadDefaultPaymentProvider(),
  ]);

  const configuredGateways = overview.filter((g) => g.configured && g.enabled);

  const savedLabel =
    params.saved === "offline"
      ? "Offline bank details"
      : params.saved === "default"
        ? "Default payment provider"
        : params.saved
          ? GATEWAY_LABELS[params.saved] ?? params.saved
          : null;

  return (
    <AdminPage narrow>
      <AdminPageHeader
        title="Payment settings"
        description="Configure Paystack, Flutterwave, Stripe, and offline bank transfer from the dashboard — no .env required."
        icon={CreditCard}
        actions={
          <Link
            href="/admin/payments"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium hover:bg-muted/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Payments
          </Link>
        }
      />

      {savedLabel && (
        <AdminAlert variant="success">{savedLabel} settings saved.</AdminAlert>
      )}

      {params.error === "offline" && (
        <AdminAlert variant="warning">Please fill all required offline bank fields.</AdminAlert>
      )}

      {params.error === "default" && (
        <AdminAlert variant="warning">
          Choose a configured and enabled gateway as the default provider
          {params.provider ? ` (${GATEWAY_LABELS[params.provider] ?? params.provider})` : ""}.
        </AdminAlert>
      )}

      {params.test && params.result && (
        <AdminAlert variant={params.result === "ok" ? "success" : "warning"}>
          {GATEWAY_LABELS[params.test] ?? params.test} connection test{" "}
          {params.result === "ok" ? "succeeded" : "failed"}. See gateway panel below.
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {overview.map((g) => (
          <AdminStatCard
            key={g.id}
            label={g.label}
            value={
              <Badge variant={g.configured && g.enabled ? "default" : "secondary"} className="mt-0">
                {!g.configured
                  ? "Not set"
                  : g.enabled
                    ? "Active"
                    : "Disabled"}
              </Badge>
            }
            hint={
              g.configured
                ? `${g.source === "admin" ? "Dashboard" : "Env"} · ${g.defaultCurrency}${g.maskedSecret ? ` · ${g.maskedSecret}` : ""}${defaultProvider === g.id.toUpperCase() ? " · Default" : ""}`
                : "Add secret key below"
            }
          />
        ))}
      </div>

      <AdminCard
        title="Default payment provider"
        description="Pre-selected when users top up their wallet. Only enabled gateways with valid API keys can be set as default."
      >
        <form action={saveDefaultPaymentProviderAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-2">
            <Label htmlFor="default-provider">Provider</Label>
            <select
              id="default-provider"
              name="provider"
              defaultValue={defaultProvider ?? configuredGateways[0]?.id.toUpperCase() ?? "PAYSTACK"}
              className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm"
              disabled={configuredGateways.length === 0}
            >
              {configuredGateways.length === 0 ? (
                <option value="">No configured gateways</option>
              ) : (
                configuredGateways.map((g) => (
                  <option key={g.id} value={g.id.toUpperCase()}>
                    {g.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <Button type="submit" disabled={configuredGateways.length === 0}>
            Save default
          </Button>
        </form>
        {defaultProvider && (
          <p className="mt-3 text-xs text-muted-foreground">
            Current default:{" "}
            <span className="font-medium text-foreground">
              {GATEWAY_LABELS[defaultProvider.toLowerCase()] ?? defaultProvider}
            </span>
          </p>
        )}
      </AdminCard>

      <PaymentGatewayPanel
        title="Paystack"
        description="Cards, bank transfer, and mobile money for Ghana and Africa."
        gatewayId="paystack"
        paymentMethod="PAYSTACK"
        config={paystack.config}
        source={paystack.source}
        lastTest={paystackTest}
        isDefault={defaultProvider === "PAYSTACK"}
        saveAction={savePaystackSettingsAction}
        testAction={testPaystackConnectionAction}
        setDefaultAction={setGatewayAsDefaultAction}
        currencyPlaceholder="GHS"
        secretPlaceholder="sk_live_... or sk_test_..."
        publicPlaceholder="pk_live_... or pk_test_..."
      />

      <PaymentGatewayPanel
        title="Flutterwave"
        description="Cards, bank, and mobile money across African markets."
        gatewayId="flutterwave"
        paymentMethod="FLUTTERWAVE"
        config={flutterwave.config}
        source={flutterwave.source}
        lastTest={flutterwaveTest}
        isDefault={defaultProvider === "FLUTTERWAVE"}
        saveAction={saveFlutterwaveSettingsAction}
        testAction={testFlutterwaveConnectionAction}
        setDefaultAction={setGatewayAsDefaultAction}
        currencyPlaceholder="NGN"
        secretPlaceholder="FLWSECK-..."
        publicPlaceholder="FLWPUBK-..."
      />

      <PaymentGatewayPanel
        title="Stripe"
        description="International cards. GHS wallet top-ups are converted to USD at the live rate before checkout."
        gatewayId="stripe"
        paymentMethod="STRIPE"
        config={stripe.config}
        source={stripe.source}
        lastTest={stripeTest}
        isDefault={defaultProvider === "STRIPE"}
        saveAction={saveStripeSettingsAction}
        testAction={testStripeConnectionAction}
        setDefaultAction={setGatewayAsDefaultAction}
        currencyPlaceholder="USD"
        secretPlaceholder="sk_live_... or sk_test_..."
        publicPlaceholder="pk_live_... or pk_test_..."
      />

      <AdminCard
        title="Offline bank transfer"
        description="Shown when users choose Bank transfer on the wallet page. Approve deposits in the Payments queue."
      >
        <form action={saveOfflinePaymentDetailsAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bank name</Label>
              <Input name="bankName" defaultValue={details.bankName} required />
            </div>
            <div className="space-y-2">
              <Label>Account name</Label>
              <Input name="accountName" defaultValue={details.accountName} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              name="accountNumber"
              defaultValue={details.accountNumber}
              required
              placeholder="1234567890"
              className="font-mono"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Branch (optional)</Label>
              <Input name="branch" defaultValue={details.branch ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>SWIFT (optional)</Label>
              <Input name="swiftCode" defaultValue={details.swiftCode ?? ""} className="font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea
              name="instructions"
              defaultValue={details.instructions}
              required
              className="min-h-[120px]"
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            Save offline details
          </Button>
        </form>
      </AdminCard>
    </AdminPage>
  );
}
