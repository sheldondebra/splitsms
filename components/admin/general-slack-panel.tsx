import { AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralSlackForm } from "@/components/admin/general-slack-form";
import { Badge } from "@/components/ui/badge";
import type { SlackOfficeConfig } from "@/lib/slack/config-shared";
import { isSlackConfigured, isSlackSupportThreadsConfigured } from "@/lib/slack/config-shared";
import { MessageSquare } from "lucide-react";

export function GeneralSlackPanel({
  config,
  eventsUrl,
}: {
  config: SlackOfficeConfig;
  eventsUrl: string;
}) {
  const configured = isSlackConfigured(config);
  const threads = isSlackSupportThreadsConfigured(config);

  return (
    <AdminCard
      title="Slack notifications"
      description="Webhook alerts plus optional support threads — reply in Slack, sync to member chat."
      actions={
        <Badge variant={configured || threads ? "default" : "secondary"} className="gap-1">
          <MessageSquare className="h-3 w-3" />
          {threads ? "Threads on" : configured ? "Webhook on" : "Not configured"}
        </Badge>
      }
    >
      <GeneralSlackForm config={config} eventsUrl={eventsUrl} />
    </AdminCard>
  );
}
