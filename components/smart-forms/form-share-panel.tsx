"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  buildEmbedUrl,
  buildIframeSnippet,
  buildPublicFormUrl,
  buildScriptSnippet,
  buildWordPressIframeSnippet,
} from "@/lib/smart-forms/share";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Copy,
  Download,
  Link2,
  Mail,
  MessageCircle,
  Code2,
  Puzzle,
  Share2,
} from "lucide-react";

type SharePanelProps = {
  formId: string;
  formName: string;
  shortCode: string;
  status: string;
  siteUrl: string;
};

function CopyBlock({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            onCopy?.();
            toast.success("Copied to clipboard");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
      <pre className="rounded-lg bg-muted px-3 py-2 text-xs whitespace-pre-wrap break-all overflow-x-auto">
        {value}
      </pre>
    </div>
  );
}

async function trackShare(formId: string, channel: string) {
  try {
    await fetch(`/api/dashboard/forms/${formId}/share-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
  } catch {
    /* non-blocking */
  }
}

export function FormSharePanel({ formId, formName, shortCode, status, siteUrl }: SharePanelProps) {
  const [utmSource, setUtmSource] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  const isPublished = status === "PUBLISHED";

  const shortUrl = useMemo(() => {
    const params: Record<string, string | undefined> = { source: "shortlink" };
    if (utmSource) params.utm_source = utmSource;
    if (utmCampaign) params.utm_campaign = utmCampaign;
    return buildPublicFormUrl(siteUrl, shortCode, params);
  }, [siteUrl, shortCode, utmSource, utmCampaign]);

  const qrUrl = `${shortUrl.split("?")[0]}?source=qr`;
  const embedIframe = buildEmbedUrl(siteUrl, shortCode, "iframe");
  const embedWordPress = buildEmbedUrl(siteUrl, shortCode, "wordpress");
  const iframeCode = buildIframeSnippet(embedIframe, formName);
  const wpIframeCode = buildWordPressIframeSnippet(embedWordPress, formName);
  const scriptCode = buildScriptSnippet(siteUrl, shortCode);

  const shareText = encodeURIComponent(`Fill out this form: ${formName}`);
  const socialLinks = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${shareText}%20${encodeURIComponent(shortUrl)}`,
      channel: "whatsapp",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(formName)}&body=${encodeURIComponent(shortUrl)}`,
      channel: "email",
    },
    {
      label: "Facebook",
      icon: Share2,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`,
      channel: "facebook",
    },
  ];

  if (!isPublished) {
    return (
      <AppCard>
        <AppCardBody className="p-6 space-y-3">
          <Badge variant="secondary">{status}</Badge>
          <p className="text-sm text-muted-foreground">
            Publish this form in the builder to unlock the short link, QR code, and embed options.
          </p>
        </AppCardBody>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Short link</h2>
            </div>
            <CopyBlock
              label="Public URL"
              value={shortUrl}
              onCopy={() => void trackShare(formId, "copy")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="utm_source">UTM source (optional)</Label>
                <Input
                  id="utm_source"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="newsletter"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="utm_campaign">UTM campaign (optional)</Label>
                <Input
                  id="utm_campaign"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="spring-drive"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              QR scans use <code className="text-foreground">{qrUrl}</code> for tracking.
            </p>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">QR code</h2>
              <div className="flex gap-2">
                <a
                  href={`/api/dashboard/forms/${formId}/qrcode`}
                  className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-muted")}
                >
                  <Download className="h-3.5 w-3.5" />
                  PNG
                </a>
                <a
                  href={`/api/dashboard/forms/${formId}/qrcode?format=svg`}
                  className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-muted")}
                >
                  <Download className="h-3.5 w-3.5" />
                  SVG
                </a>
              </div>
            </div>
            <div className="flex justify-center rounded-xl border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/dashboard/forms/${formId}/qrcode?inline=1`}
                alt={`QR code for ${formName}`}
                width={200}
                height={200}
                className="h-[200px] w-[200px]"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scans are tracked as QR code opens in analytics.
            </p>
          </AppCardBody>
        </AppCard>
      </div>

      <AppCard>
        <AppCardBody className="p-5 space-y-4">
          <h2 className="font-semibold">Share on social</h2>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.channel}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void trackShare(formId, item.channel)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </div>
        </AppCardBody>
      </AppCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Website iframe</h2>
            </div>
            <CopyBlock label="Embed code" value={iframeCode} onCopy={() => void trackShare(formId, "embed")} />
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">JavaScript embed</h2>
            </div>
            <CopyBlock label="Script embed" value={scriptCode} onCopy={() => void trackShare(formId, "script")} />
            <p className="text-xs text-muted-foreground">
              Auto-resizes the iframe height when the form content changes.
            </p>
          </AppCardBody>
        </AppCard>
      </div>

      <AppCard>
        <AppCardBody className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Puzzle className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">WordPress</h2>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Open your WordPress admin dashboard.</li>
            <li>Edit the page or post where you want the form.</li>
            <li>Add a <strong className="text-foreground">Custom HTML</strong> block.</li>
            <li>Paste the iframe code below and publish.</li>
          </ol>
          <CopyBlock label="WordPress iframe" value={wpIframeCode} />
          <p className="text-xs text-muted-foreground">
            Shortcode plugin coming later: <code>[splitsms_form id=&quot;{shortCode}&quot;]</code>
          </p>
        </AppCardBody>
      </AppCard>
    </div>
  );
}
