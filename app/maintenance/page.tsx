import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { AuthLayout, AuthCard } from "@/components/auth/auth-layout";
import { MaintenancePoller } from "@/components/maintenance/maintenance-poller";
import { loadMaintenanceConfig } from "@/lib/admin/maintenance";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Under maintenance",
  description: "SplitSMS is temporarily undergoing scheduled maintenance.",
  path: "/maintenance",
  noIndex: true,
});

export default async function MaintenancePage() {
  const config = await loadMaintenanceConfig();

  return (
    <AuthLayout
      title="Be right back"
      subtitle="SplitSMS is undergoing scheduled maintenance"
      sideDescription="We're making improvements behind the scenes. Access will resume automatically once maintenance is complete."
    >
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Under maintenance</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {config.message}
          </p>
          <MaintenancePoller />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
