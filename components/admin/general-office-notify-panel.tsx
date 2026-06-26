import { Badge } from "@/components/ui/badge";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { GeneralNotifyForm } from "@/components/admin/general-notify-form";
import type { GeneralOfficeConfig } from "@/lib/general-office/config";

type GeneralOfficeNotifyPanelProps = {
  config: GeneralOfficeConfig;
};

export function GeneralOfficeNotifyPanel({ config }: GeneralOfficeNotifyPanelProps) {
  const contactCount = config.notifyEmails.length + config.notifyPhones.length;

  return (
    <AdminCard
      title="Operations alerts"
      description="Who gets email and SMS for new sender ID requests and support tickets."
      actions={
        <Badge variant="secondary">
          {contactCount} extra contact{contactCount === 1 ? "" : "s"}
        </Badge>
      }
    >
      <GeneralNotifyForm config={config} />
    </AdminCard>
  );
}
