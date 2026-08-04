import { getSession } from "@/lib/auth/session";
import { getGoogleConnectionPublic } from "@/lib/google/connection";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { GoogleIntegrationPanel } from "@/components/dashboard/google-integration-panel";
import { Link2 } from "lucide-react";

export const metadata = {
  title: "Google integration",
};

export default async function GoogleIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const connection = await getGoogleConnectionPublic(session.userId);

  const error = typeof params.error === "string" ? params.error : undefined;
  const connected = params.connected === "1";
  const disconnected = params.disconnected === "1";

  return (
    <AppPage>
      <PageHeader
        title="Google"
        description="Connect your Google account for Contacts, Sheets, and Forms SMS."
        icon={Link2}
        mobileDescription="Connect Google for Contacts, Sheets, and Forms."
      />
      <GoogleIntegrationPanel
        connection={connection}
        flash={{ connected, disconnected, error }}
      />
    </AppPage>
  );
}
