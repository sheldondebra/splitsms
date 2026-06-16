"use client";

import {
  deleteContactAction,
  addContactToGroupAction,
  updateContactAction,
} from "@/lib/actions/contacts";
import { ContactSendLink } from "@/components/contacts/contact-send-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobileCardItem, MobileCardList } from "@/components/dashboard/page-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Phone, Mail, Trash2, Users } from "lucide-react";

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
      <div className="md:hidden">
        <EmptyState
          icon={Users}
          title="No contacts here"
          description="Try changing your filters, import a CSV, or add a contact manually."
        />
      </div>
    );
  }

  return (
    <div className="md:hidden">
      <MobileCardList>
      {contacts.map((c) => (
        <MobileCardItem key={c.id}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{c.name || "Unnamed contact"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono text-xs sm:text-sm">{c.phone}</span>
                </p>
                {c.email ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </p>
                ) : null}
              </div>
              {c.countryCode ? (
                <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                  {c.countryCode}
                </Badge>
              ) : null}
            </div>

            {c.tags ? (
              <div className="flex flex-wrap gap-1">
                {c.tags.split(/[,;]+/).map((tag) => {
                  const trimmed = tag.trim();
                  if (!trimmed) return null;
                  return (
                    <Badge key={trimmed} variant="secondary" className="text-[10px]">
                      {trimmed}
                    </Badge>
                  );
                })}
              </div>
            ) : null}

            {c.groups.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {c.groups.map((g) => (
                  <Badge key={g.group.id} variant="outline" className="text-[10px]">
                    {g.group.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2 pt-1">
              <ContactSendLink
                phone={c.phone}
                countryCode={c.countryCode}
                className="flex-1 justify-center"
              />
            </div>

            <form action={updateContactAction} className="grid gap-2 pt-1 border-t border-border/50">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="email" value={c.email ?? ""} />
              <div className="grid grid-cols-2 gap-2">
                <Input name="name" defaultValue={c.name ?? ""} placeholder="Name" className="h-10" />
                <Input name="tags" defaultValue={c.tags ?? ""} placeholder="Tags" className="h-10" />
              </div>
              <Button type="submit" variant="outline" size="sm" className="h-10 w-full">
                Save changes
              </Button>
            </form>

            <div className="flex gap-2">
              {groups.length > 0 ? (
                <form action={addContactToGroupAction} className="flex flex-1 gap-2 min-w-0">
                  <input type="hidden" name="contactId" value={c.id} />
                  <select
                    name="groupId"
                    className="flex h-10 flex-1 min-w-0 rounded-lg border border-input bg-background px-2 text-sm"
                    defaultValue=""
                  >
                    <option value="">Add to group…</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="secondary" className="h-10 shrink-0 px-4">
                    Add
                  </Button>
                </form>
              ) : null}
              <form action={deleteContactAction} className={groups.length > 0 ? "" : "flex-1"}>
                <input type="hidden" name="id" value={c.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="h-10 text-destructive px-3 w-full"
                  aria-label="Delete contact"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </MobileCardItem>
      ))}
      </MobileCardList>
    </div>
  );
}
