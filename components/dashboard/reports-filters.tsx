import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReportsFiltersProps = {
  campaignId?: string;
  status?: string;
  country?: string;
  q?: string;
};

export function ReportsFilters({
  campaignId = "",
  status = "all",
  country = "all",
  q = "",
}: ReportsFiltersProps) {
  return (
    <form className="grid gap-4 md:grid-cols-5 items-end" method="get">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="q">Search phone or message</Label>
        <Input id="q" name="q" defaultValue={q} placeholder="233..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All</option>
          <option value="PENDING">Pending</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input id="country" name="country" defaultValue={country && country !== "all" ? country : ""} placeholder="GH (optional)" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign">Campaign ID</Label>
        <Input id="campaign" name="campaign" defaultValue={campaignId} placeholder="Optional" />
      </div>
      <div className="flex gap-2 md:col-span-5">
        <Button type="submit">Filter</Button>
        <Link href="/dashboard/reports">
          <Button type="button" variant="outline">
            Reset
          </Button>
        </Link>
        <a
          href={`/api/dashboard/reports/export?${new URLSearchParams({
            ...(q ? { q } : {}),
            ...(status !== "all" ? { status } : {}),
            ...(country && country !== "all" ? { country } : {}),
            ...(campaignId ? { campaign: campaignId } : {}),
          }).toString()}`}
          className="ml-auto"
        >
          <Button type="button" variant="secondary">
            Export CSV
          </Button>
        </a>
      </div>
    </form>
  );
}
