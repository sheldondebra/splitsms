import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicSmartFormView } from "@/components/smart-forms/public-smart-form";
import { createCaptchaChallenge } from "@/lib/smart-forms/captcha";
import {
  getPublishedSmartFormByShortCode,
  recordSmartFormOpen,
} from "@/lib/smart-forms/public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}): Promise<Metadata> {
  const { shortCode } = await params;
  const found = await getPublishedSmartFormByShortCode(shortCode);
  if (!found) return { title: "Form not found" };
  return {
    title: found.publicForm.name,
    description: found.publicForm.description ?? undefined,
  };
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

  const captcha = found.publicForm.captchaEnabled ? createCaptchaChallenge() : null;

  return <PublicSmartFormView form={found.publicForm} source={source} captcha={captcha} />;
}
