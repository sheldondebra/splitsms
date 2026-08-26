import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicSmartFormView } from "@/components/smart-forms/public-smart-form";
import {
  getPublishedSmartFormByShortCode,
  recordSmartFormOpen,
} from "@/lib/smart-forms/public";
import { recaptchaSiteKey } from "@/lib/auth/signup-guard-shared";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}): Promise<Metadata> {
  const { shortCode } = await params;
  const found = await getPublishedSmartFormByShortCode(shortCode);
  if (!found) {
    return buildPageMetadata({
      title: "Form not found",
      description: "This form may have been removed or the link is incorrect.",
      path: `/f/${shortCode}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: found.publicForm.name,
    description: found.publicForm.description ?? "Submit this SplitSMS Smart Form.",
    path: `/f/${shortCode}`,
    noIndex: true,
  });
}

export default async function PublicSmartFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ shortCode: string }>;
  searchParams: Promise<{ source?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const { shortCode } = await params;
  const sp = await searchParams;
  const source = sp.source ?? sp.utm_source ?? "direct";

  const found = await getPublishedSmartFormByShortCode(shortCode);
  if (!found) notFound();

  await recordSmartFormOpen(found.form.id, found.form.userId, source, "page");

  return (
    <PublicSmartFormView
      form={found.publicForm}
      source={source}
      recaptchaSiteKey={found.publicForm.captchaEnabled ? recaptchaSiteKey() : null}
    />
  );
}
