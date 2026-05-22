"use client";

import { useState } from "react";
import { ContactsBulkActions } from "@/components/contacts/contacts-bulk-actions";
import { ContactsMobileList } from "@/components/contacts/contacts-mobile-list";
import {
  deleteContactAction,
  addContactToGroupAction,
  updateContactAction,
} from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function ContactsTable({
  contacts,
  groups,
}: {
  contacts: Contact[];
  groups: Group[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  }

  return (
    <div className="space-y-4">
      <ContactsBulkActions
        groups={groups}
        selectedIds={[...selected]}
        onClear={() => setSelected(new Set())}
      />
      <ContactsMobileList contacts={contacts} groups={groups} />

      <div className="hidden md:block rounded-lg border overflow-x-auto app-scroll-x">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={contacts.length > 0 && selected.size === contacts.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Select ${c.phone}`}
                  />
                </TableCell>
                <TableCell>
                  <form action={updateContactAction} className="flex gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <Input name="name" defaultValue={c.name ?? ""} className="h-8 text-sm" />
                    <input type="hidden" name="email" value={c.email ?? ""} />
                    <input type="hidden" name="tags" value={c.tags ?? ""} />
                    <Button type="submit" size="sm" variant="ghost">
                      Save
                    </Button>
                  </form>
                </TableCell>
                <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                <TableCell>{c.countryCode ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.tags ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.groups.map((g) => (
                      <Badge key={g.group.id} variant="secondary" className="text-xs">
                        {g.group.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {groups.map((g) => (
                    <form key={g.id} action={addContactToGroupAction} className="inline">
                      <input type="hidden" name="groupId" value={g.id} />
                      <input type="hidden" name="contactId" value={c.id} />
                      <Button type="submit" size="sm" variant="outline" className="text-xs">
                        +{g.name}
                      </Button>
                    </form>
                  ))}
                  <form action={deleteContactAction} className="inline">
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      Del
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
