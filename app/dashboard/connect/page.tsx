import { getSession } from "@/lib/auth/session";
import { getConnectDashboardData } from "@/lib/connect/dashboard";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { ConnectHub } from "@/components/dashboard/connect-hub";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Connect",
};

export default async function ConnectDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const data = await getConnectDashboardData(session.userId);

  return (
    <AppPage wide>
      <PageHeader
        title="Connect"
        description="API keys, embedded customers, WordPress sites, sender IDs, and routing — one hub for SplitSMS Connect."
        icon={Link2}
        actions={
          <Link href="/docs/connect" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
            Connect docs
          </Link>
        }
      />
      <ConnectHub data={data} />
    </AppPage>
  );
}
