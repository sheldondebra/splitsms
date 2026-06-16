"use client";

import Link from "next/link";
import { useState } from "react";
import {
  bulkDeleteContactsAction,
  bulkTagContactsAction,
  bulkMoveToGroupAction,
} from "@/lib/actions/contacts";
import { buildSendToContactsUrl } from "@/lib/contacts/send-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X } from "lucide-react";

type Group = { id: string; name: string };

type SelectedContact = {
  phone: string;
  countryCode?: string | null;
};

export function ContactsBulkActions({
  groups,
  selectedIds,
  selectedContacts,
  onClear,
}: {
  groups: Group[];
  selectedIds: string[];
  selectedContacts: SelectedContact[];
  onClear: () => void;
}) {
  const [tag, setTag] = useState("");
  const idsValue = selectedIds.join(",");

  if (selectedIds.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {selectedIds.length} contact{selectedIds.length === 1 ? "" : "s"} selected
        </span>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Link
          href={buildSendToContactsUrl(selectedContacts)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
          Send SMS to selected
        </Link>

        <form action={bulkTagContactsAction} className="flex gap-2 flex-1 min-w-[200px]">
          <input type="hidden" name="ids" value={idsValue} />
          <Input
            name="tag"
            placeholder="Add tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-10 flex-1"
          />
          <Button type="submit" size="sm" variant="outline" className="h-10 shrink-0">
            Tag
          </Button>
        </form>

        {groups.length > 0 ? (
          <form action={bulkMoveToGroupAction} className="flex gap-2 flex-1 min-w-[200px]">
            <input type="hidden" name="ids" value={idsValue} />
            <select
              name="groupId"
              className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm min-w-0"
              required
              defaultValue={groups[0]?.id}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline" className="h-10 shrink-0">
              Move to group
            </Button>
          </form>
        ) : null}

        <form action={bulkDeleteContactsAction}>
          <input type="hidden" name="ids" value={idsValue} />
          <Button type="submit" size="sm" variant="destructive" className="h-10 w-full sm:w-auto">
            Delete selected
          </Button>
        </form>
      </div>
    </div>
  );
}
