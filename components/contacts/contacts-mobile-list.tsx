"use client";

import {
  deleteContactAction,
  addContactToGroupAction,
  updateContactAction,
} from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobileCardItem, MobileCardList } from "@/components/dashboard/page-shell";
import { Phone, Mail, Trash2 } from "lucide-react";

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  countryCode: string | null;
  tags: string | null;
  groups: { group: { id: string; name: string } }[];
};

type Group = { id: string; name: string };

export function ContactsMobileList({
  contacts,
  groups,
}: {
  contacts: Contact[];
  groups: Group[];
}) {
  if (contacts.length === 0) {
    return (
      <p className="md:hidden text-sm text-muted-foreground text-center py-8">
        No contacts match your filters.
      </p>
    );
  }

  return (
    <MobileCardList>
      {contacts.map((c) => (
        <MobileCardItem key={c.id}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.name || "No name"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono">{c.phone}</span>
                </p>
                {c.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {c.email}
                  </p>
                )}
              </div>
              {c.countryCode && (
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {c.countryCode}
                </Badge>
              )}
            </div>

            {c.groups.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.groups.map((g) => (
                  <Badge key={g.group.id} variant="secondary" className="text-[10px]">
                    {g.group.name}
                  </Badge>
                ))}
              </div>
            )}

            <form action={updateContactAction} className="grid gap-2">
              <input type="hidden" name="id" value={c.id} />
              <Input name="name" defaultValue={c.name ?? ""} placeholder="Name" className="h-10" />
              <Input name="tags" defaultValue={c.tags ?? ""} placeholder="Tags" className="h-10" />
              <Button type="submit" variant="outline" size="sm" className="h-10 w-full">
                Save
              </Button>
            </form>

            <div className="flex gap-2">
              {groups.length > 0 && (
                <form action={addContactToGroupAction} className="flex-1 flex gap-2">
                  <input type="hidden" name="contactId" value={c.id} />
                  <select
                    name="groupId"
                    className="flex h-10 flex-1 rounded-lg border border-input bg-background px-2 text-sm min-w-0"
                    defaultValue=""
                  >
                    <option value="">Add to group…</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="secondary" className="h-10 shrink-0">
                    Add
                  </Button>
                </form>
              )}
              <form action={deleteContactAction}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" size="sm" variant="ghost" className="h-10 text-destructive px-3">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </MobileCardItem>
      ))}
    </MobileCardList>
  );
}
