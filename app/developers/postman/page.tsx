import { PostmanPanel } from "@/components/developers/postman-panel";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { Braces } from "lucide-react";
import { headers } from "next/headers";

export default async function DevelopersPostmanPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  return (
    <AppPage medium>
      <PageHeader
        title="Postman"
        description="Import our collection, set your API key, and run requests without writing curl."
        icon={Braces}
        mobileDescription="Download collection and test the API."
      />
      <PostmanPanel baseUrl={baseUrl} />
    </AppPage>
  );
}
