"use client";

import { useState } from "react";
import { ContactsBulkActions } from "@/components/contacts/contacts-bulk-actions";
import { ContactsMobileList } from "@/components/contacts/contacts-mobile-list";
import { ContactsPagination } from "@/components/contacts/contacts-pagination";
import { ContactSendLink } from "@/components/contacts/contact-send-link";
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
import { cn } from "@/lib/utils";
import { Mail, Pencil, Trash2, Users } from "lucide-react";

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

function contactInitials(name: string | null, phone: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return `${first}${second}`.toUpperCase() || "?";
  }
  return phone.replace(/\D/g, "").slice(-2) || "?";
}

function ContactAvatar({ name, phone }: { name: string | null; phone: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      aria-hidden
    >
      {contactInitials(name, phone)}
    </div>
  );
}

export function ContactsTable({
  contacts,
  groups,
  total,
  page,
  perPage,
  query,
}: ContactsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const selectedContacts = contacts.filter((c) => selected.has(c.id));
  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

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
    <div className="space-y-0">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3 sm:px-6 sm:flex-row sm:items-center sm:justify-between bg-muted/15">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {showingFrom}–{showingTo}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {total.toLocaleString()}
          </span>
        </p>
      </div>

      {selected.size > 0 ? (
        <div className="px-4 sm:px-6 pt-4">
          <ContactsBulkActions
            groups={groups}
            selectedIds={[...selected]}
            selectedContacts={selectedContacts}
            onClear={() => setSelected(new Set())}
          />
        </div>
      ) : null}

      <ContactsMobileList contacts={contacts} groups={groups} />

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-11 pl-4 sm:pl-6">
                <input
                  type="checkbox"
                  checked={contacts.length > 0 && selected.size === contacts.length}
                  onChange={toggleAll}
                  aria-label="Select all contacts"
                  className="h-4 w-4 rounded border-input accent-primary"
                />
              </TableHead>
              <TableHead className="min-w-[220px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Country
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Groups
              </TableHead>
              <TableHead className="pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((c) => {
              const isEditing = editingId === c.id;
              const isSelected = selected.has(c.id);

              return (
                <TableRow
                  key={c.id}
                  className={cn(
                    "group border-border/50 transition-colors",
                    isSelected && "bg-primary/[0.03]",
                  )}
                >
                  <TableCell className="pl-4 sm:pl-6">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.name || c.phone}`}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <ContactAvatar name={c.name} phone={c.phone} />
                      <div className="min-w-0 flex-1 space-y-1">
                        {isEditing ? (
                          <form
                            action={updateContactAction}
                            className="space-y-2"
                            onSubmit={() => setEditingId(null)}
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="email" value={c.email ?? ""} />
                            <input type="hidden" name="tags" value={c.tags ?? ""} />
                            <div className="flex gap-2">
                              <Input
                                name="name"
                                defaultValue={c.name ?? ""}
                                placeholder="Name"
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button type="submit" size="sm" className="h-8 shrink-0">
                                Save
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 shrink-0"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {c.name?.trim() || "Unnamed contact"}
                            </p>
                            <button
                              type="button"
                              onClick={() => setEditingId(c.id)}
                              className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                              aria-label="Edit name"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <p className="font-mono text-xs text-muted-foreground">{c.phone}</p>
                        {c.email ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {c.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {c.countryCode ? (
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {c.countryCode}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[140px]">
                    {c.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.split(/[,;]+/).map((tag) => {
                          const trimmed = tag.trim();
                          if (!trimmed) return null;
                          return (
                            <Badge key={trimmed} variant="secondary" className="text-[10px] font-normal">
                              {trimmed}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[160px]">
                    {c.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.groups.map((g) => (
                          <Badge key={g.group.id} variant="outline" className="text-[10px] font-normal">
                            {g.group.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="pr-4 sm:pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <ContactSendLink phone={c.phone} countryCode={c.countryCode} compact />

                      {groups.length > 0 ? (
                        <form action={addContactToGroupAction} className="flex items-center">
                          <input type="hidden" name="contactId" value={c.id} />
                          <select
                            name="groupId"
                            className="h-8 w-[88px] rounded-md border border-input bg-background px-1.5 text-[11px]"
                            defaultValue=""
                            aria-label="Add to group"
                          >
                            <option value="">Group…</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="ghost" className="h-8 px-2 text-xs">
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
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          aria-label="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="border-t border-border/50 bg-muted/15 px-4 py-3 sm:px-6">
          <ContactsPagination page={page} total={total} perPage={perPage} query={query} />
        </div>
      </div>

      <div className="md:hidden px-4 py-3 border-t border-border/50 bg-muted/15">
        <ContactsPagination page={page} total={total} perPage={perPage} query={query} />
      </div>
    </div>
  );
}
