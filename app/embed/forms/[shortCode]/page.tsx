import { notFound } from "next/navigation";
import { PublicSmartFormView } from "@/components/smart-forms/public-smart-form";
import {
  getPublishedSmartFormByShortCode,
  recordSmartFormOpen,
} from "@/lib/smart-forms/public";
import { recaptchaSiteKey } from "@/lib/auth/signup-guard-shared";

export default async function EmbedSmartFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ shortCode: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { shortCode } = await params;
  const { source } = await searchParams;

  const found = await getPublishedSmartFormByShortCode(shortCode);
  if (!found) notFound();

  await recordSmartFormOpen(found.form.id, found.form.userId, source, "embed");

  return (
    <PublicSmartFormView
      form={found.publicForm}
      source={source ?? "iframe"}
      embedMode
      recaptchaSiteKey={found.publicForm.captchaEnabled ? recaptchaSiteKey() : null}
    />
  );
}
