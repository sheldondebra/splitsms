import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Group = { id: string; name: string };

export function ContactsFilters({
  q,
  country,
  tag,
  groupId,
  groups,
}: {
  q?: string;
  country?: string;
  tag?: string;
  groupId?: string;
  groups: Group[];
}) {
  return (
    <form
      method="get"
      className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-semibold">Search & filter</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="contacts-q" className="text-xs text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="contacts-q"
              name="q"
              placeholder="Name, phone, or tag…"
              defaultValue={q}
              className="pl-9 h-11"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contacts-country" className="text-xs text-muted-foreground">
            Country
          </Label>
          <Input
            id="contacts-country"
            name="country"
            placeholder="e.g. GH"
            defaultValue={country}
            className="h-11 uppercase font-mono"
            maxLength={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contacts-tag" className="text-xs text-muted-foreground">
            Tag
          </Label>
          <Input id="contacts-tag" name="tag" placeholder="vip" defaultValue={tag} className="h-11" />
        </div>
        <div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
          <Label htmlFor="contacts-group" className="text-xs text-muted-foreground">
            Group
          </Label>
          <select
            id="contacts-group"
            name="groupId"
            defaultValue={groupId ?? ""}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
          <Button type="submit" className="w-full h-11 rounded-xl font-semibold">
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  );
}
