import { redirect } from "next/navigation";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const q = params.created ? `?created=${encodeURIComponent(params.created)}` : "";
  redirect(`/developers/api-keys${q}`);
}
