"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Globe2,
  Palette,
  Settings2,
  Upload,
  WalletCards,
} from "lucide-react";
import {
  saveResellerBrandingSettingsAction,
  saveResellerDomainSettingsAction,
  saveResellerGatewaySettingsAction,
  saveResellerPayoutDetailsAction,
} from "@/lib/actions/reseller-settings-payouts";
import { TenantDnsGuide } from "@/components/tenant/tenant-dns-guide";
import { DomainDnsConnectionTest } from "@/components/reseller/settings/domain-dns-connection-test";
import { ResellerSignupLinkPanel } from "@/components/reseller/reseller-signup-link-panel";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ResellerInviteStats } from "@/lib/reseller/invite-analytics";

export type ResellerSettingsData = {
  brandName: string;
  domain: string | null;
  signupShareUrl: string;
  signupDomainUrl: string | null;
  signupStats: ResellerInviteStats;
  branding: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string | null;
    supportEmail: string | null;
  };
  payments: {
    checkoutMode: "PLATFORM" | "OWN";
    paystackEnabled: boolean;
    paystackPublicKey: string;
    paystackSecretMasked: string;
    stripeEnabled: boolean;
    stripePublishableKey: string;
    stripeSecretMasked: string;
    payoutMethod: "MOBILE_MONEY" | "BANK_TRANSFER";
    payoutPhone: string;
    payoutAccountName: string;
    payoutBankName: string;
    payoutAccountNumber: string;
    payoutNotes: string;
  };
};

const TABS = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "domain", label: "Domain / DNS", icon: Globe2 },
  { id: "payments", label: "Payment gateways", icon: CreditCard },
  { id: "payout", label: "Payout details", icon: WalletCards },
] as const;

export function ResellerSettingsView({
  data,
  flash,
  initialTab,
}: {
  data: ResellerSettingsData;
  flash?: { saved?: string; error?: string };
  initialTab?: string;
}) {
  const startTab = TABS.some((t) => t.id === initialTab) ? initialTab! : "branding";
  const [logoPreview, setLogoPreview] = useState<string | null>(data.branding.logoUrl);
  const [domainInput, setDomainInput] = useState(data.domain ?? "");
  const [checkoutMode, setCheckoutMode] = useState<"PLATFORM" | "OWN">(
    data.payments.checkoutMode,
  );
  const [payoutMethod, setPayoutMethod] = useState<"MOBILE_MONEY" | "BANK_TRANSFER">(
    data.payments.payoutMethod,
  );

  const flashMessage = useMemo(() => {
    if (flash?.error) {
      return {
        tone: "destructive" as const,
        text: decodeURIComponent(flash.error),
      };
    }
    if (flash?.saved === "branding") return { tone: "ok" as const, text: "Branding saved." };
    if (flash?.saved === "domain") return { tone: "ok" as const, text: "Domain settings saved." };
    if (flash?.saved === "payments") {
      return { tone: "ok" as const, text: "Payment gateway settings saved." };
    }
    if (flash?.saved === "payout") {
      return { tone: "ok" as const, text: "Payout destination details saved." };
    }
    if (flash?.saved) return { tone: "ok" as const, text: "Settings saved." };
    return null;
  }, [flash]);

  return (
    <ResellerPage className="max-w-4xl">
      <ResellerPageHeader
        title="Settings"
        description="Organize branding, custom domain, payment gateways, and where payouts should be sent."
        icon={Settings2}
        actions={
          <Link href="/reseller/payouts" className={cn(buttonVariants({ variant: "outline" }))}>
            Open payouts
          </Link>
        }
      />

      {flashMessage ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            flashMessage.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {flashMessage.text}
        </p>
      ) : null}

      <Tabs defaultValue={startTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="branding" className="mt-4 space-y-4">
          <ResellerCard title="Brand identity" description="Logo, colors, and support contact for your portal.">
            <form action={saveResellerBrandingSettingsAction} className="space-y-5" encType="multipart/form-data">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand name</Label>
                <Input id="brandName" name="brandName" defaultValue={data.brandName} />
              </div>

              <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={112}
                      height={112}
                      className="h-full w-full object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="logoFile">Upload logo</Label>
                    <Input
                      id="logoFile"
                      name="logoFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLogoPreview(URL.createObjectURL(file));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF · max 2MB</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Or logo URL</Label>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      defaultValue={data.branding.logoUrl ?? ""}
                      placeholder="https://..."
                      onChange={(e) => {
                        if (e.target.value.trim()) setLogoPreview(e.target.value.trim());
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary accent</Label>
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    defaultValue={data.branding.primaryColor}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Sidebar background</Label>
                  <Input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    defaultValue={data.branding.secondaryColor}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent (optional)</Label>
                  <Input
                    id="accentColor"
                    name="accentColor"
                    type="color"
                    defaultValue={data.branding.accentColor ?? "#f97316"}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support email</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  defaultValue={data.branding.supportEmail ?? ""}
                  placeholder="support@yourbrand.com"
                />
              </div>

              <Button type="submit">Save branding</Button>
            </form>
          </ResellerCard>
        </TabsContent>

        <TabsContent value="domain" className="mt-4 space-y-4">
          <ResellerSignupLinkPanel
            shareUrl={data.signupShareUrl}
            domainUrl={data.signupDomainUrl}
            stats={data.signupStats}
          />

          <ResellerCard
            title="Custom domain"
            description="Connect a branded hostname so clients sign in and sign up on your domain."
          >
            <form action={saveResellerDomainSettingsAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="domain">Hostname</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="sms.yourcompany.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
              </div>
              <TenantDnsGuide domain={domainInput || data.domain} />
              <DomainDnsConnectionTest key={domainInput.trim().toLowerCase()} domain={domainInput} />
              <Button type="submit">Save domain</Button>
            </form>
          </ResellerCard>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-4">
          <ResellerCard
            title="Checkout mode"
            description="Choose whether clients top up with SplitSMS platform gateways or your own keys."
          >
            <form action={saveResellerGatewaySettingsAction} className="space-y-5">
              <input type="hidden" name="checkoutMode" value={checkoutMode} />
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCheckoutMode("PLATFORM")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    checkoutMode === "PLATFORM"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:bg-muted/30",
                  )}
                >
                  <p className="text-sm font-semibold">Use SplitSMS / super admin gateways</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Clients pay through platform Paystack/Stripe. You fund and manage wallets as usual.
                  </p>
                  {checkoutMode === "PLATFORM" ? (
                    <Badge className="mt-3 bg-primary/15 text-primary hover:bg-primary/15">Selected</Badge>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMode("OWN")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    checkoutMode === "OWN"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 hover:bg-muted/30",
                  )}
                >
                  <p className="text-sm font-semibold">Connect my Paystack / Stripe</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Collect payments with your own merchant accounts under your brand.
                  </p>
                  {checkoutMode === "OWN" ? (
                    <Badge className="mt-3 bg-primary/15 text-primary hover:bg-primary/15">Selected</Badge>
                  ) : null}
                </button>
              </div>

              <div className={cn("space-y-5", checkoutMode !== "OWN" && "opacity-60")}>
                <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="paystackEnabled"
                      value="1"
                      defaultChecked={data.payments.paystackEnabled}
                      disabled={checkoutMode !== "OWN"}
                    />
                    Paystack
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="paystackPublicKey">Public key</Label>
                      <Input
                        id="paystackPublicKey"
                        name="paystackPublicKey"
                        defaultValue={data.payments.paystackPublicKey}
                        disabled={checkoutMode !== "OWN"}
                        placeholder="pk_live_..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paystackSecretKey">Secret key</Label>
                      <Input
                        id="paystackSecretKey"
                        name="paystackSecretKey"
                        defaultValue={data.payments.paystackSecretMasked}
                        disabled={checkoutMode !== "OWN"}
                        placeholder="sk_live_..."
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 p-4 space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="stripeEnabled"
                      value="1"
                      defaultChecked={data.payments.stripeEnabled}
                      disabled={checkoutMode !== "OWN"}
                    />
                    Stripe
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stripePublishableKey">Publishable key</Label>
                      <Input
                        id="stripePublishableKey"
                        name="stripePublishableKey"
                        defaultValue={data.payments.stripePublishableKey}
                        disabled={checkoutMode !== "OWN"}
                        placeholder="pk_live_..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripeSecretKey">Secret key</Label>
                      <Input
                        id="stripeSecretKey"
                        name="stripeSecretKey"
                        defaultValue={data.payments.stripeSecretMasked}
                        disabled={checkoutMode !== "OWN"}
                        placeholder="sk_live_..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit">Save payment settings</Button>
            </form>
          </ResellerCard>
        </TabsContent>

        <TabsContent value="payout" className="mt-4 space-y-4">
          <ResellerCard
            title="Where should we send funds?"
            description="Used when you request a payout from your reseller wallet. Super admins process these requests."
          >
            <form action={saveResellerPayoutDetailsAction} className="space-y-5">
              <input type="hidden" name="payoutMethod" value={payoutMethod} />
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod("MOBILE_MONEY")}
                  className={cn(
                    "rounded-2xl border p-4 text-left",
                    payoutMethod === "MOBILE_MONEY"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60",
                  )}
                >
                  <p className="text-sm font-semibold">Mobile money</p>
                  <p className="mt-1 text-xs text-muted-foreground">MTN, Telecel, AirtelTigo, etc.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod("BANK_TRANSFER")}
                  className={cn(
                    "rounded-2xl border p-4 text-left",
                    payoutMethod === "BANK_TRANSFER"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60",
                  )}
                >
                  <p className="text-sm font-semibold">Bank transfer</p>
                  <p className="mt-1 text-xs text-muted-foreground">Account name + number</p>
                </button>
              </div>

              {payoutMethod === "MOBILE_MONEY" ? (
                <div className="space-y-2">
                  <Label htmlFor="payoutPhone">Mobile money number</Label>
                  <Input
                    id="payoutPhone"
                    name="payoutPhone"
                    defaultValue={data.payments.payoutPhone}
                    placeholder="+233..."
                    required={payoutMethod === "MOBILE_MONEY"}
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="payoutAccountName">Account name</Label>
                    <Input
                      id="payoutAccountName"
                      name="payoutAccountName"
                      defaultValue={data.payments.payoutAccountName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoutBankName">Bank name</Label>
                    <Input
                      id="payoutBankName"
                      name="payoutBankName"
                      defaultValue={data.payments.payoutBankName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoutAccountNumber">Account number</Label>
                    <Input
                      id="payoutAccountNumber"
                      name="payoutAccountNumber"
                      defaultValue={data.payments.payoutAccountNumber}
                      required
                    />
                  </div>
                </div>
              )}

              {payoutMethod === "MOBILE_MONEY" ? (
                <>
                  <input type="hidden" name="payoutAccountName" value={data.payments.payoutAccountName} />
                  <input type="hidden" name="payoutBankName" value={data.payments.payoutBankName} />
                  <input type="hidden" name="payoutAccountNumber" value={data.payments.payoutAccountNumber} />
                </>
              ) : (
                <input type="hidden" name="payoutPhone" value={data.payments.payoutPhone} />
              )}

              <div className="space-y-2">
                <Label htmlFor="payoutNotes">Notes for finance (optional)</Label>
                <Textarea
                  id="payoutNotes"
                  name="payoutNotes"
                  defaultValue={data.payments.payoutNotes}
                  placeholder="Preferred network, branch, etc."
                />
              </div>

              <Button type="submit">Save payout details</Button>
            </form>
          </ResellerCard>
        </TabsContent>
      </Tabs>
    </ResellerPage>
  );
}
