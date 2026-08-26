import { emailLayout, type EmailLayoutParams } from "@/lib/email/layout";
import { loadEmailOfficeStored } from "@/lib/email/office-config";

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
  });
}
