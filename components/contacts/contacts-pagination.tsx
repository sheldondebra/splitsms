import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function buildContactsQueryString(params: {
  q?: string;
  country?: string;
  tag?: string;
  groupId?: string;
  page?: number;
}) {
  const qp = new URLSearchParams();
  if (params.q) qp.set("q", params.q);
  if (params.country) qp.set("country", params.country);
  if (params.tag) qp.set("tag", params.tag);
  if (params.groupId) qp.set("groupId", params.groupId);
  if (params.page && params.page > 1) qp.set("page", String(params.page));
  const s = qp.toString();
  return s ? `?${s}` : "";
}

export function ContactsPagination({
  page,
  total,
  perPage,
  query,
}: {
  page: number;
  total: number;
  perPage: number;
  query: { q?: string; country?: string; tag?: string; groupId?: string };
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/60">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={`/dashboard/contacts${buildContactsQueryString({ ...query, page: page - 1 })}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 h-10 rounded-lg")}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={`/dashboard/contacts${buildContactsQueryString({ ...query, page: page + 1 })}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 h-10 rounded-lg")}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
