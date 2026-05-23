import { PostmanPanel } from "@/components/developers/postman-panel";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { Braces } from "lucide-react";
import { getSiteUrl } from "@/lib/site-config";

export default function DevelopersPostmanPage() {
  const baseUrl = getSiteUrl();

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
