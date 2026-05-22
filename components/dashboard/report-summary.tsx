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
    <div className="grid grid-cols-3 gap-2 md:gap-4 md:grid-cols-3">
      {items.map(({ label, value, icon: Icon, className }) => (
        <Card key={label} className="border-border/60">
          <CardContent className="flex flex-col items-center text-center gap-2 pt-4 pb-4 md:flex-row md:text-left md:items-center md:gap-4 md:pt-6">
            <div
              className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full border ${className}`}
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-3xl font-bold tabular-nums">{value}</p>
              <p className="text-[10px] md:text-sm text-muted-foreground leading-tight mt-0.5">
                {label.replace("Messages ", "")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
