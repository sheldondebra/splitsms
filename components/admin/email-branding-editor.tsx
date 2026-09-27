"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmailBrandingImageField } from "@/components/admin/email-branding-image-field";
import {
  emailLayout,
  textToEmailParagraphs,
  type EmailHeaderImagePosition,
} from "@/lib/email/layout";
import type { EmailOfficePublic } from "@/lib/email/office-config";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandingState = {
  headerTagline: string;
  headerImageUrl: string;
  headerImageHref: string;
  headerImagePosition: EmailHeaderImagePosition;
  footerText: string;
  footerImageUrl: string;
  footerImageHref: string;
  footerImagePosition: EmailHeaderImagePosition;
  footerLinkLabel: string;
  footerLinkUrl: string;
};

function fromStored(stored: EmailOfficePublic): BrandingState {
  return {
    headerTagline: stored.headerTagline ?? "",
    headerImageUrl: stored.headerImageUrl ?? "",
    headerImageHref: stored.headerImageHref ?? "",
    headerImagePosition: stored.headerImagePosition === "below" ? "below" : "above",
    footerText: stored.footerText ?? "",
    footerImageUrl: stored.footerImageUrl ?? "",
    footerImageHref: stored.footerImageHref ?? "",
    footerImagePosition: stored.footerImagePosition === "below" ? "below" : "above",
    footerLinkLabel: stored.footerLinkLabel ?? "",
    footerLinkUrl: stored.footerLinkUrl ?? "",
  };
}

export function EmailBrandingEditor({ stored }: { stored: EmailOfficePublic }) {
  const [branding, setBranding] = useState(() => fromStored(stored));
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    setPreviewReady(true);
  }, []);

  const previewHtml = useMemo(() => {
    if (!previewReady) return "";
    return emailLayout({
      showLogo: true,
      headline: "Your message headline",
      preheader: "Preview of header and footer branding",
      greeting: "Hi there,",
      bodyHtml: textToEmailParagraphs(
        "This is a sample body so you can see how the header and footer sit around your content.\n\nUpload images, edit the tagline and footer text, then check the live preview on the right.",
      ),
      ctaHref: "https://www.splitsms.com",
      ctaLabel: "Open SplitSMS",
      headerTagline: branding.headerTagline || undefined,
      headerImageUrl: branding.headerImageUrl || undefined,
      headerImageHref: branding.headerImageHref || undefined,
      headerImagePosition: branding.headerImagePosition,
      footerText: branding.footerText || undefined,
      footerImageUrl: branding.footerImageUrl || undefined,
      footerImageHref: branding.footerImageHref || undefined,
      footerImagePosition: branding.footerImagePosition,
      footerLinkLabel: branding.footerLinkLabel || undefined,
      footerLinkUrl: branding.footerLinkUrl || undefined,
    });
  }, [branding, previewReady]);

  const hasBranding = Boolean(
    branding.headerImageUrl ||
      branding.footerImageUrl ||
      branding.footerText ||
      branding.headerTagline,
  );

  function patch(partial: Partial<BrandingState>) {
    setBranding((prev) => ({ ...prev, ...partial }));
  }

  return (
    <section className="space-y-4 border-t border-border/60 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <ImageIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Header &amp; footer branding</p>
            <p className="mt-1 max-w-lg text-xs text-muted-foreground">
              Upload images, edit copy, set positions, and add links. Preview updates as you type.
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={
            hasBranding
              ? "gap-1 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
              : "text-muted-foreground"
          }
        >
          {hasBranding ? "Branding set" : "Optional"}
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="space-y-4 border-b border-border/60 bg-muted/15 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Header
            </p>
            <div className="space-y-2">
              <Label htmlFor="headerTagline">Tagline</Label>
              <Input
                id="headerTagline"
                name="headerTagline"
                type="text"
                value={branding.headerTagline}
                onChange={(e) => patch({ headerTagline: e.target.value })}
                placeholder="Reliable SMS for growing businesses"
              />
              <p className="text-[11px] text-muted-foreground">
                Shown under the logo at the top of the email.
              </p>
            </div>
            <EmailBrandingImageField
              name="headerImageUrl"
              id="headerImageUrl"
              label="Header image"
              value={branding.headerImageUrl}
              onChange={(headerImageUrl) => patch({ headerImageUrl })}
              hint="Full-width banner (~1120px). Upload or paste a public HTTPS URL."
            />
            <div className="space-y-2">
              <Label htmlFor="headerImageHref">Image link</Label>
              <Input
                id="headerImageHref"
                name="headerImageHref"
                type="url"
                value={branding.headerImageHref}
                onChange={(e) => patch({ headerImageHref: e.target.value })}
                placeholder="https://www.splitsms.com"
              />
              <p className="text-[11px] text-muted-foreground">
                Optional — clicking the header image opens this URL.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Image position
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={cn(
                    "flex cursor-pointer flex-col gap-3 rounded-lg border px-3 py-3 transition-colors",
                    branding.headerImagePosition === "above"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="headerImagePosition"
                      value="above"
                      checked={branding.headerImagePosition === "above"}
                      onChange={() => patch({ headerImagePosition: "above" })}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm font-semibold">Above headline</span>
                  </div>
                  <div
                    className="overflow-hidden rounded-md border border-border/60 bg-muted/40 p-2"
                    aria-hidden
                  >
                    <div className="h-5 rounded-sm bg-primary/25" />
                    <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-foreground/20" />
                    <div className="mt-1 h-1 w-4/5 rounded-full bg-foreground/10" />
                  </div>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer flex-col gap-3 rounded-lg border px-3 py-3 transition-colors",
                    branding.headerImagePosition === "below"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="headerImagePosition"
                      value="below"
                      checked={branding.headerImagePosition === "below"}
                      onChange={() => patch({ headerImagePosition: "below" })}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm font-semibold">Below headline</span>
                  </div>
                  <div
                    className="overflow-hidden rounded-md border border-border/60 bg-muted/40 p-2"
                    aria-hidden
                  >
                    <div className="h-1.5 w-2/3 rounded-full bg-foreground/20" />
                    <div className="mt-1 h-1 w-4/5 rounded-full bg-foreground/10" />
                    <div className="mt-1.5 h-5 rounded-sm bg-primary/25" />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-background px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Footer
            </p>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer text</Label>
              <Textarea
                id="footerText"
                name="footerText"
                rows={3}
                value={branding.footerText}
                onChange={(e) => patch({ footerText: e.target.value })}
                placeholder="Questions? Reply to this email or visit our help center."
              />
            </div>
            <EmailBrandingImageField
              name="footerImageUrl"
              id="footerImageUrl"
              label="Footer image"
              value={branding.footerImageUrl}
              onChange={(footerImageUrl) => patch({ footerImageUrl })}
              hint="Optional badge, seal, or promo strip in the footer."
            />
            <div className="space-y-2">
              <Label htmlFor="footerImageHref">Footer image link</Label>
              <Input
                id="footerImageHref"
                name="footerImageHref"
                type="url"
                value={branding.footerImageHref}
                onChange={(e) => patch({ footerImageHref: e.target.value })}
                placeholder="https://www.splitsms.com/pricing"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Footer image position
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors",
                    branding.footerImagePosition === "above"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background hover:bg-muted/30",
                  )}
                >
                  <input
                    type="radio"
                    name="footerImagePosition"
                    value="above"
                    checked={branding.footerImagePosition === "above"}
                    onChange={() => patch({ footerImagePosition: "above" })}
                    className="h-4 w-4 accent-primary"
                  />
                  Above footer text
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors",
                    branding.footerImagePosition === "below"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/70 bg-background hover:bg-muted/30",
                  )}
                >
                  <input
                    type="radio"
                    name="footerImagePosition"
                    value="below"
                    checked={branding.footerImagePosition === "below"}
                    onChange={() => patch({ footerImagePosition: "below" })}
                    className="h-4 w-4 accent-primary"
                  />
                  Below footer text
                </label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="footerLinkLabel">Extra link label</Label>
                <Input
                  id="footerLinkLabel"
                  name="footerLinkLabel"
                  type="text"
                  value={branding.footerLinkLabel}
                  onChange={(e) => patch({ footerLinkLabel: e.target.value })}
                  placeholder="View pricing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerLinkUrl">Extra link URL</Label>
                <Input
                  id="footerLinkUrl"
                  name="footerLinkUrl"
                  type="url"
                  value={branding.footerLinkUrl}
                  onChange={(e) => patch({ footerLinkUrl: e.target.value })}
                  placeholder="https://www.splitsms.com/pricing"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Site and contact links stay in the footer automatically. Add one custom link above them.
            </p>
          </div>
        </div>

        <div className="space-y-2 xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Live preview</p>
            <p className="text-[11px] text-muted-foreground">Header &amp; footer</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-zinc-100 shadow-sm dark:bg-zinc-900">
            {previewReady ? (
              <iframe
                title="Email header and footer preview"
                srcDoc={previewHtml}
                className="h-[640px] w-full bg-white"
                sandbox=""
              />
            ) : (
              <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                Loading preview…
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sample content only — save settings to apply branding to real emails.
          </p>
        </div>
      </div>
    </section>
  );
}
