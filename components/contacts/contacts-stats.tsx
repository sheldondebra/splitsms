import Link from "next/link";
import { Users, UsersRound, Globe, Upload, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type ContactsStatsProps = {
  total: number;
  allCount: number;
  groupCount: number;
  countryCount: number;
  filtered: boolean;
};

export function ContactsStats({
  total,
  allCount,
  groupCount,
  countryCount,
  filtered,
}: ContactsStatsProps) {
  const empty = allCount === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              empty
                ? "bg-primary/10 text-primary ring-primary/15"
                : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
            )}
          >
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {empty
                ? "Build your audience"
                : filtered
                  ? `${total.toLocaleString()} matching ${total === 1 ? "contact" : "contacts"}`
                  : `${allCount.toLocaleString()} ${allCount === 1 ? "contact" : "contacts"} ready`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {empty
                ? "Import a CSV, sync Google, or add people one by one — then send SMS or run campaigns."
                : filtered
                  ? `Showing filtered results from ${allCount.toLocaleString()} total`
                  : "Search, group, and message from one list"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/contacts?tab=import"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-1.5 rounded-xl",
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Link>
          <Link
            href="/dashboard/contacts?tab=add"
            className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add contact
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3">
        {[
          {
            label: filtered ? "Matching" : "Contacts",
            value: total,
            icon: Users,
            hint: filtered ? "After filters" : "In your address book",
            tone: "primary" as const,
          },
          {
            label: "Groups",
            value: groupCount,
            icon: UsersRound,
            hint: "For campaigns & bulk SMS",
            tone: "neutral" as const,
          },
          {
            label: "Countries",
            value: countryCount,
            icon: Globe,
            hint: "Distinct country codes",
            tone: "neutral" as const,
          },
        ].map(({ label, value, icon: Icon, hint, tone }, index) => (
          <div
            key={label}
            className={cn(
              "p-4",
              index < 2 && "border-b border-border/50 sm:border-b-0 sm:border-r",
              tone === "primary" && "bg-primary/[0.03]",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                  tone === "primary"
                    ? "bg-primary/10 text-primary ring-primary/15"
                    : "bg-muted text-muted-foreground ring-border/60",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
            </div>
            <p
              className={cn(
                "mt-3 text-2xl font-bold tabular-nums tracking-tight",
                tone === "primary" && "text-primary",
              )}
            >
              {value.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
