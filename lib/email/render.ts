import { emailLayout, type EmailLayoutParams } from "@/lib/email/layout";
import { loadEmailOfficeStored } from "@/lib/email/office-config";

function orUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Server-only renderer: loads admin branding, then renders the shared shell.
 * Keep this out of client bundles — it reaches the database.
 */
export async function renderEmailLayout(params: EmailLayoutParams) {
  const stored = await loadEmailOfficeStored();
  return emailLayout({
    ...params,
    headerImageUrl:
      params.headerImageUrl ||
      (params.showLogo ? stored.headerImageUrl || undefined : undefined),
    headerImagePosition: params.headerImagePosition ?? stored.headerImagePosition,
    headerImageHref: orUndefined(params.headerImageHref ?? stored.headerImageHref),
    headerTagline: orUndefined(params.headerTagline ?? stored.headerTagline),
    footerText: orUndefined(params.footerText ?? stored.footerText),
    footerImageUrl: orUndefined(params.footerImageUrl ?? stored.footerImageUrl),
    footerImagePosition: params.footerImagePosition ?? stored.footerImagePosition,
    footerImageHref: orUndefined(params.footerImageHref ?? stored.footerImageHref),
    footerLinkLabel: orUndefined(params.footerLinkLabel ?? stored.footerLinkLabel),
    footerLinkUrl: orUndefined(params.footerLinkUrl ?? stored.footerLinkUrl),
  });
}
