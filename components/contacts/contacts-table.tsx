"use client";

import { useState } from "react";
import { ContactsBulkActions } from "@/components/contacts/contacts-bulk-actions";
import { ContactsMobileList } from "@/components/contacts/contacts-mobile-list";
import { ContactsPagination } from "@/components/contacts/contacts-pagination";
import { EmptyState } from "@/components/dashboard/empty-state";
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
import { Users, Trash2 } from "lucide-react";

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

type ContactsTableProps = {
  contacts: Contact[];
  groups: Group[];
  total: number;
  page: number;
  perPage: number;
  query: { q?: string; country?: string; tag?: string; groupId?: string };
};

export function ContactsTable({
  contacts,
  groups,
  total,
  page,
  perPage,
  query,
}: ContactsTableProps) {
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

  if (contacts.length === 0) {
    return (
      <>
        <ContactsMobileList contacts={[]} groups={groups} />
        <div className="hidden md:block">
          <EmptyState
            icon={Users}
            title="No contacts match"
            description="Adjust your filters or import contacts from the Import tab."
          />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <ContactsBulkActions
        groups={groups}
        selectedIds={[...selected]}
        onClear={() => setSelected(new Set())}
      />

      <ContactsMobileList contacts={contacts} groups={groups} />

      <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && selected.size === contacts.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="rounded border-input"
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead className="text-right w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.phone}`}
                      className="rounded border-input"
                    />
                  </TableCell>
                  <TableCell>
                    <form action={updateContactAction} className="flex items-center gap-2 max-w-[200px]">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="email" value={c.email ?? ""} />
                      <input type="hidden" name="tags" value={c.tags ?? ""} />
                      <Input
                        name="name"
                        defaultValue={c.name ?? ""}
                        placeholder="Name"
                        className="h-9 text-sm"
                      />
                      <Button type="submit" size="sm" variant="ghost" className="h-9 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        Save
                      </Button>
                    </form>
                    {c.email ? (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                        {c.email}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{c.phone}</TableCell>
                  <TableCell>
                    {c.countryCode ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        {c.countryCode}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {c.tags ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {c.groups.length > 0 ? (
                        c.groups.map((g) => (
                          <Badge key={g.group.id} variant="secondary" className="text-[10px]">
                            {g.group.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {groups.length > 0 ? (
                        <form action={addContactToGroupAction} className="flex gap-1">
                          <input type="hidden" name="contactId" value={c.id} />
                          <select
                            name="groupId"
                            className="h-9 max-w-[100px] rounded-md border border-input bg-background px-2 text-xs"
                            defaultValue=""
                          >
                            <option value="">Group…</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline" className="h-9 text-xs shrink-0">
                            Add
                          </Button>
                        </form>
                      ) : null}
                      <form action={deleteContactAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0 text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 pb-4">
          <ContactsPagination page={page} total={total} perPage={perPage} query={query} />
        </div>
      </div>

      <div className="md:hidden">
        <ContactsPagination page={page} total={total} perPage={perPage} query={query} />
      </div>
    </div>
  );
}
