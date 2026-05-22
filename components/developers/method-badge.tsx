import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/lib/developers/api-reference";

const styles: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  POST: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  PUT: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/25",
  DELETE: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
};

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[3.25rem] justify-center rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide",
        styles[method],
      )}
    >
      {method}
    </span>
  );
}
