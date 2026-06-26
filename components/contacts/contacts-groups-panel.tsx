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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <UsersRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Contact groups</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize contacts for targeted campaigns and bulk sends.
            </p>
          </div>
        </div>
      </div>

      <form
        action={createGroupAction}
        className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-4"
      >
        <p className="text-sm font-semibold">Create a group</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group name</Label>
            <Input id="group-name" name="name" placeholder="Newsletter" required className="h-11 bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-desc">Description (optional)</Label>
            <Input id="group-desc" name="description" placeholder="Monthly updates" className="h-11 bg-background" />
          </div>
        </div>
        <Button type="submit" className="h-11 rounded-xl font-semibold sm:w-auto w-full">
          Create group
        </Button>
      </form>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
          <UsersRound className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">No groups yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a group to organize contacts for campaigns.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li
              key={g.id}
              className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{g.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {g._count.members} member{g._count.members === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
                <form action={renameGroupAction} className="flex gap-2 flex-1 sm:flex-initial">
                  <input type="hidden" name="id" value={g.id} />
                  <Input name="name" placeholder="New name" className="h-10 flex-1 sm:w-40 bg-background" />
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
