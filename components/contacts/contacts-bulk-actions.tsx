"use client";

import { useState } from "react";
import {
  bulkDeleteContactsAction,
  bulkTagContactsAction,
  bulkMoveToGroupAction,
} from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Group = { id: string; name: string };

export function ContactsBulkActions({
  groups,
  selectedIds,
  onClear,
}: {
  groups: Group[];
  selectedIds: string[];
  onClear: () => void;
}) {
  const [tag, setTag] = useState("");
  const idsValue = selectedIds.join(",");

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <span className="text-sm font-medium">{selectedIds.length} selected</span>
      <form action={bulkTagContactsAction} className="flex gap-2">
        <input type="hidden" name="ids" value={idsValue} />
        <Input
          name="tag"
          placeholder="Add tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="h-8 w-28"
        />
        <Button type="submit" size="sm" variant="outline">
          Tag
        </Button>
      </form>
      {groups.length > 0 && (
        <form action={bulkMoveToGroupAction} className="flex gap-1">
          <input type="hidden" name="ids" value={idsValue} />
          <select
            name="groupId"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            required
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline">
            Move
          </Button>
        </form>
      )}
      <form action={bulkDeleteContactsAction}>
        <input type="hidden" name="ids" value={idsValue} />
        <Button type="submit" size="sm" variant="destructive">
          Delete
        </Button>
      </form>
      <Button type="button" size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
