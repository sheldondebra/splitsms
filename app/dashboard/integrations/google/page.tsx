import { getSession } from "@/lib/auth/session";
import { getGoogleConnectionProfile } from "@/lib/google/connection";
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
  const connection = await getGoogleConnectionProfile(session.userId);

  const error = typeof params.error === "string" ? params.error : undefined;
  const connected = params.connected === "1";
  const disconnected = params.disconnected === "1";

  return (
    <AppPage>
      <PageHeader
        title="Google"
        description="Send SMS from Google Forms, or import Contacts and Sheets."
        icon={Link2}
        mobileDescription="Forms SMS, Contacts, and Sheets."
      />
      <GoogleIntegrationPanel
        connection={connection}
        flash={{ connected, disconnected, error }}
      />
    </AppPage>
  );
}
