import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { saveSenderIdReservedConfigAction } from "@/lib/actions/admin-sender-ids";
import type { SenderIdReservedConfig } from "@/lib/sender-ids/reserved-names";
import { Shield } from "lucide-react";

type SenderIdPolicyPanelProps = {
  config: SenderIdReservedConfig;
};

export function SenderIdPolicyPanel({ config }: SenderIdPolicyPanelProps) {
  return (
    <AdminCard
      title="Reserved sender names"
      description="Block impersonation of telcos, banks, government bodies, and global brands. Built-in lists cover Ghana (MTN, NLA, GRA, etc.) and major international names."
      actions={
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          Auto-block active
        </Badge>
      }
    >
      <form action={saveSenderIdReservedConfigAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="extraExact">Extra blocked names (exact match)</Label>
          <Textarea
            id="extraExact"
            name="extraExact"
            rows={4}
            placeholder="MYCOMPETITOR&#10;LOCALBRAND"
            defaultValue={config.extraExact.join("\n")}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            One per line. Normalized to uppercase letters and numbers only.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="extraPrefixes">Extra blocked prefixes</Label>
          <Textarea
            id="extraPrefixes"
            name="extraPrefixes"
            rows={3}
            placeholder="MYBRAND"
            defaultValue={config.extraPrefixes.join("\n")}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Blocks the prefix and any Sender ID starting with it (min 3 characters).
          </p>
        </div>
        <Button type="submit" size="sm">
          Save blocked names
        </Button>
      </form>
    </AdminCard>
  );
}
