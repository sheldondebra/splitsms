import { redirect } from "next/navigation";

export default async function AdminMnotifyRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("tab", "mnotify");
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  redirect(`/admin/providers?${qs.toString()}`);
}
