import type { Metadata } from "next";
import { format } from "date-fns";
import { Wrench, Clock } from "lucide-react";
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
          {config.scheduledEndAt ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" />
              Expected back {format(new Date(config.scheduledEndAt), "MMM d, yyyy · HH:mm")}
            </p>
          ) : null}
          <MaintenancePoller />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
