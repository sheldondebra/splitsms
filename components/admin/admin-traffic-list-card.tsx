import { AdminCard, AdminEmpty } from "@/components/admin/admin-page-shell";

export function AdminTrafficListCard({
  title,
  rows,
  emptyLabel = "No data yet.",
  mono = false,
}: {
  title: string;
  rows: { label: string; value: number }[];
  emptyLabel?: string;
  mono?: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <AdminCard title={title} dense>
      {rows.length === 0 ? (
        <AdminEmpty dense>{emptyLabel}</AdminEmpty>
      ) : (
        <ul className="space-y-2.5 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-primary/10"
                style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3 px-2 py-1.5">
                <span className={mono ? "truncate font-mono text-xs text-foreground" : "truncate capitalize text-foreground"}>
                  {r.label || "Unassigned"}
                </span>
                <span className="shrink-0 tabular-nums font-medium text-foreground">{r.value}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
