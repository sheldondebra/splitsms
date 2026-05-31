"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  SendContactGroupOption,
  SendContactOption,
} from "@/lib/contacts/send-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookUser, Search, UsersRound } from "lucide-react";

type ContactPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: SendContactOption[];
  groups: SendContactGroupOption[];
  totalContacts: number;
  onAdd: (phones: string[]) => void;
  disabled?: boolean;
};

type TabId = "contacts" | "groups";

export function ContactPickerDialog({
  open,
  onOpenChange,
  contacts,
  groups,
  totalContacts,
  onAdd,
  disabled,
}: ContactPickerDialogProps) {
  const [tab, setTab] = useState<TabId>("contacts");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false),
    );
  }, [contacts, query]);

  const selectedCount = selectedIds.size;

  function toggleContact(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function addSelectedContacts() {
    const phones = contacts
      .filter((c) => selectedIds.has(c.id))
      .map((c) => c.phone);
    if (phones.length === 0) return;
    onAdd(phones);
    setSelectedIds(new Set());
    setQuery("");
    onOpenChange(false);
  }

  function addGroup(group: SendContactGroupOption) {
    const phones = group.contacts.map((c) => c.phone);
    if (phones.length === 0) return;
    onAdd(phones);
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setSelectedIds(new Set());
      setTab("contacts");
    }
    onOpenChange(next);
  }

  const empty = totalContacts === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2">
            <BookUser className="h-5 w-5 text-primary" />
            Select from contacts
          </DialogTitle>
          <DialogDescription>
            {empty
              ? "Add contacts first, then pick recipients here."
              : `${totalContacts.toLocaleString()} contact${totalContacts === 1 ? "" : "s"} in your address book`}
          </DialogDescription>
        </DialogHeader>

        {empty ? (
          <div className="px-5 py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
            <Link
              href="/dashboard/contacts"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
              )}
            >
              Go to Contacts
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or phone…"
                  className="pl-9 h-10"
                  disabled={disabled}
                />
              </div>

              <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5 w-full">
                <button
                  type="button"
                  onClick={() => setTab("contacts")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === "contacts"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Contacts
                </button>
                <button
                  type="button"
                  onClick={() => setTab("groups")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5",
                    tab === "groups"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <UsersRound className="h-3.5 w-3.5" />
                  Groups
                  {groups.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {groups.length}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            <div className="max-h-[min(50vh,320px)] overflow-y-auto px-3 py-2">
              {tab === "contacts" ? (
                filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No contacts match your search.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {filtered.map((contact) => {
                      const checked = selectedIds.has(contact.id);
                      return (
                        <li key={contact.id}>
                          <label
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                              checked ? "bg-primary/10" : "hover:bg-muted/60",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleContact(contact.id)}
                              disabled={disabled}
                              className="h-4 w-4 rounded border-input accent-primary shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {contact.name?.trim() || "Unnamed contact"}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground truncate">
                                {contact.phone}
                              </p>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No groups yet.{" "}
                  <Link href="/dashboard/contacts" className="text-primary hover:underline">
                    Create a group
                  </Link>
                </p>
              ) : (
                <ul className="space-y-1">
                  {groups.map((group) => (
                    <li
                      key={group.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.memberCount} contact{group.memberCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={disabled || group.memberCount === 0}
                        onClick={() => addGroup(group)}
                        className="shrink-0 h-8"
                      >
                        Add all
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {tab === "contacts" && filtered.length > 0 && (
              <div className="px-5 flex items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border/60 py-2">
                <span>{selectedCount} selected</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="text-primary hover:underline font-medium"
                  >
                    Select all
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!empty && (
          <DialogFooter className="px-5 py-4 border-t border-border/60 sm:justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            {tab === "contacts" && (
              <Button
                type="button"
                disabled={disabled || selectedCount === 0}
                onClick={addSelectedContacts}
              >
                Add {selectedCount > 0 ? selectedCount : ""} recipient
                {selectedCount === 1 ? "" : "s"}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ContactPickerTriggerProps = {
  contacts: SendContactOption[];
  groups: SendContactGroupOption[];
  totalContacts: number;
  onAdd: (phones: string[]) => void;
  disabled?: boolean;
};

export function ContactPickerTrigger({
  contacts,
  groups,
  totalContacts,
  onAdd,
  disabled,
}: ContactPickerTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="gap-1.5 h-8 rounded-lg"
      >
        <BookUser className="h-3.5 w-3.5" />
        From contacts
        {totalContacts > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-0.5">
            {totalContacts}
          </Badge>
        )}
      </Button>
      <ContactPickerDialog
        open={open}
        onOpenChange={setOpen}
        contacts={contacts}
        groups={groups}
        totalContacts={totalContacts}
        onAdd={onAdd}
        disabled={disabled}
      />
    </>
  );
}
