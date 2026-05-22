import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export function ReportSummary({
  delivered,
  failed,
  pending,
}: {
  delivered: number;
  failed: number;
  pending: number;
}) {
  const items = [
    {
      label: "Messages delivered",
      value: delivered,
      icon: CheckCircle2,
      className: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Messages failed",
      value: failed,
      icon: XCircle,
      className: "text-destructive bg-destructive/10 border-destructive/20",
    },
    {
      label: "Messages pending",
      value: pending,
      icon: Clock,
      className: "text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon, className }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${className}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
