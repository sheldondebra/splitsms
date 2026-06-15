import { notFound } from "next/navigation";
import { PublicSmartFormView } from "@/components/smart-forms/public-smart-form";
import { createCaptchaChallenge } from "@/lib/smart-forms/captcha";
import {
  getPublishedSmartFormByShortCode,
  recordSmartFormOpen,
} from "@/lib/smart-forms/public";

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

  const captcha = found.publicForm.captchaEnabled ? createCaptchaChallenge() : null;

  return (
    <PublicSmartFormView
      form={found.publicForm}
      source={source ?? "iframe"}
      embedMode
      captcha={captcha}
    />
  );
}
