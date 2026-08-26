import { redirect } from "next/navigation";

export default async function SmartFormAutomationPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  redirect(`/dashboard/forms/${formId}/builder?tab=sms`);
}
