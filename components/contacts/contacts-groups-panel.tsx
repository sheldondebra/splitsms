import {
  createGroupAction,
  renameGroupAction,
  deleteGroupAction,
} from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersRound, Trash2 } from "lucide-react";

type GroupRow = {
  id: string;
  name: string;
  _count: { members: number };
};

export function ContactsGroupsPanel({ groups }: { groups: GroupRow[] }) {
  return (
    <div className="space-y-6">
      <form
        action={createGroupAction}
        className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Create a group</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group name</Label>
            <Input id="group-name" name="name" placeholder="Newsletter" required className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-desc">Description (optional)</Label>
            <Input id="group-desc" name="description" placeholder="Monthly updates" className="h-11" />
          </div>
        </div>
        <Button type="submit" className="h-11 rounded-xl font-semibold sm:w-auto w-full">
          Create group
        </Button>
      </form>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-dashed">
          No groups yet. Create one to organize contacts for campaigns.
        </p>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{g.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {g._count.members} member{g._count.members === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <form action={renameGroupAction} className="flex gap-2 flex-1 sm:flex-initial">
                  <input type="hidden" name="id" value={g.id} />
                  <Input name="name" placeholder="New name" className="h-10 flex-1 sm:w-36" />
                  <Button type="submit" size="sm" variant="outline" className="h-10 shrink-0">
                    Rename
                  </Button>
                </form>
                <form action={deleteGroupAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-10 text-destructive gap-1.5 w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
