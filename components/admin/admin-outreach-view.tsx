"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminSendOutreachAction } from "@/lib/actions/admin-outreach";
import {
  buildOutreachHref,
  type AdminOutreachDashboard,
} from "@/lib/admin/outreach-shared";
import {
  AdminOutreachComposeFields,
  OutreachComposeHiddenFields,
  useOutreachCompose,
} from "@/components/admin/admin-outreach-compose";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminAlert,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MessagesSquare,
  Phone,
  Plus,
  Search,
  Send,
  Store,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type CustomContact = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

const ROLE_FILTERS = [
  { id: "all", label: "All users", icon: Users },
  { id: "member", label: "Members", icon: UserPlus },
  { id: "reseller", label: "Resellers", icon: Store },
  { id: "enterprise", label: "Enterprise", icon: Building2 },
] as const;

function roleBadgeClass(role: string) {
  if (role === "RESELLER") return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  if (role === "ENTERPRISE") return "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300";
  return "border-border bg-muted/50 text-muted-foreground";
}

function SendOutreachButton({
  count,
  disabled,
}: {
  count: number;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending || count === 0} className="gap-1.5 w-full">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Send to {count} recipient{count === 1 ? "" : "s"}
        </>
      )}
    </Button>
  );
}

export function AdminOutreachView({
  data,
  flash,
}: {
  data: AdminOutreachDashboard;
  flash?: { saved?: string; error?: string; count?: string; failed?: string };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const compose = useOutreachCompose();

  const rowIds = useMemo(() => data.rows.map((r) => r.id), [data.rows]);
  const rowIdsKey = rowIds.join(",");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prevRowIdsKey, setPrevRowIdsKey] = useState(rowIdsKey);
  const [customContacts, setCustomContacts] = useState<CustomContact[]>([]);
  const [customPhones, setCustomPhones] = useState("");
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });

  if (rowIdsKey !== prevRowIdsKey) {
    setPrevRowIdsKey(rowIdsKey);
    setSelected(new Set());
  }

  const selectedUserIds = useMemo(
    () => [...selected].filter((id) => rowIds.includes(id)),
    [selected, rowIds],
  );

  const totalSelected = selectedUserIds.length + customContacts.length;
  const atLimit = totalSelected >= data.maxRecipients;

  const pastedPhoneCount = useMemo(() => {
    if (!customPhones.trim()) return 0;
    return customPhones
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [customPhones]);

  const sendCount = totalSelected + pastedPhoneCount;

  const returnTo = buildOutreachHref({
    q: data.q,
    role: data.role,
    page: data.page,
  });

  const allSelected = rowIds.length > 0 && selectedUserIds.length === rowIds.length;
  const someSelected = selectedUserIds.length > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    if (checked && atLimit) return;
    if (checked) {
      const room = data.maxRecipients - customContacts.length;
      setSelected(new Set(rowIds.slice(0, room)));
    } else {
      setSelected(new Set());
    }
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size + customContacts.length >= data.maxRecipients) return prev;
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function addCustomContact() {
    if (atLimit) return;
    const name = newContact.name.trim() || "Contact";
    const phone = newContact.phone.trim();
    const email = newContact.email.trim();
    if (!phone && !email) return;
    setCustomContacts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, phone, email },
    ]);
    setNewContact({ name: "", phone: "", email: "" });
  }

  function removeCustomContact(id: string) {
    setCustomContacts((prev) => prev.filter((c) => c.id !== id));
  }

  function navigate(next: Partial<{ q: string; role: string; page: number }>) {
    router.push(
      buildOutreachHref({
        q: next.q ?? data.q,
        role: next.role ?? data.role,
        page: next.page ?? 1,
      }),
    );
  }

  const rangeStart = data.filteredTotal === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(data.page * data.pageSize, data.filteredTotal);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Bulk messages"
        description="Send SMS and email to members, resellers, enterprise accounts, or custom phone numbers and emails."
        icon={MessagesSquare}
        actions={
          <Link href="/admin/members" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Member directory
          </Link>
        }
      />

      {flash?.saved === "sent" && (
        <AdminAlert variant="success">
          {flash.count ?? "0"} message{(flash.count === "1" ? "" : "s")} sent successfully.
          {flash.failed ? ` ${flash.failed} could not be delivered.` : ""}
        </AdminAlert>
      )}
      {flash?.error === "outreach_none" && (
        <AdminAlert variant="warning">Select platform users or add custom contacts before sending.</AdminAlert>
      )}
      {flash?.error === "outreach_limit" && (
        <AdminAlert variant="warning">Maximum {data.maxRecipients} recipients per send.</AdminAlert>
      )}
      {flash?.error === "outreach_channel" && (
        <AdminAlert variant="warning">Select at least SMS or email.</AdminAlert>
      )}
      {(flash?.error === "outreach_sms" || flash?.error === "outreach_email") && (
        <AdminAlert variant="warning">Fill in the message fields before sending.</AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Members" value={data.roleCounts.member.toLocaleString()} />
        <AdminStatCard label="Resellers" value={data.roleCounts.reseller.toLocaleString()} />
        <AdminStatCard label="Enterprise" value={data.roleCounts.enterprise.toLocaleString()} />
        <AdminStatCard
          label="Selected"
          value={totalSelected}
          hint={`Up to ${data.maxRecipients} per send`}
          variant={totalSelected > 0 ? "primary" : "default"}
        />
      </div>

      <form ref={formRef} action={adminSendOutreachAction} className="grid gap-6 lg:grid-cols-5">
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="userIds" value={selectedUserIds.join(",")} />
        <input
          type="hidden"
          name="customRecipients"
          value={JSON.stringify(
            customContacts.map((c) => ({
              name: c.name,
              phone: c.phone || undefined,
              email: c.email || undefined,
            })),
          )}
        />
        <input type="hidden" name="customPhones" value={customPhones} />
        <OutreachComposeHiddenFields compose={compose} />

        <div className="lg:col-span-3 space-y-4">
          <AdminCard
            title="Choose recipients"
            description="Search platform users or add external contacts"
            dense
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {ROLE_FILTERS.map((f) => {
                const Icon = f.icon;
                const active = data.role === f.id;
                const count =
                  f.id === "all"
                    ? data.roleCounts.member + data.roleCounts.reseller + data.roleCounts.enterprise
                    : data.roleCounts[f.id as keyof typeof data.roleCounts];
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate({ role: f.id, page: 1 })}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 hover:border-primary/30",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {f.label}
                    <span className={cn("tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>
                      {count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  defaultValue={data.q}
                  placeholder="Search name, phone, or email…"
                  className="pl-9 h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      navigate({ q: (e.target as HTMLInputElement).value, page: 1 });
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  const input = formRef.current?.querySelector<HTMLInputElement>(
                    'input[placeholder="Search name, phone, or email…"]',
                  );
                  navigate({ q: input?.value ?? "", page: 1 });
                }}
              >
                Search
              </Button>
            </div>

            {data.rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No users match this search.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 pr-0">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={(e) => toggleAll(e.target.checked)}
                          disabled={atLimit && !someSelected}
                          aria-label="Select all on page"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row) => {
                      const isSelected = selected.has(row.id);
                      const disabled = !isSelected && atLimit;
                      return (
                        <TableRow
                          key={row.id}
                          className={cn(isSelected && "bg-primary/[0.04]")}
                        >
                          <TableCell className="w-10 pr-0">
                            <Checkbox
                              checked={isSelected}
                              disabled={disabled}
                              onChange={(e) => toggleOne(row.id, e.target.checked)}
                              aria-label={`Select ${row.fullName}`}
                            />
                          </TableCell>
                          <TableCell>
                            {row.role === "MEMBER" ? (
                              <Link
                                href={`/admin/members/${row.id}`}
                                className="font-semibold text-sm hover:text-primary"
                              >
                                {row.fullName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-sm">{row.fullName}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <p className="font-mono">{row.phone}</p>
                            {row.email && (
                              <p className="text-muted-foreground truncate max-w-[180px]">{row.email}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", roleBadgeClass(row.role))}
                            >
                              {row.roleLabel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {data.totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <p className="text-xs text-muted-foreground">
                      {rangeStart}–{rangeEnd} of {data.filteredTotal.toLocaleString()}
                    </p>
                    <div className="flex gap-1">
                      {data.page > 1 ? (
                        <Link
                          href={buildOutreachHref({ q: data.q, role: data.role, page: data.page - 1 })}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Link>
                      ) : null}
                      {data.page < data.totalPages ? (
                        <Link
                          href={buildOutreachHref({ q: data.q, role: data.role, page: data.page + 1 })}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )}
              </>
            )}
          </AdminCard>

          <AdminCard
            title="Custom contacts"
            description="People without a platform account — paste numbers or add one by one"
            dense
          >
            <div className="space-y-3">
              <div>
                <Label htmlFor="bulk-phones" className="text-xs text-muted-foreground">
                  Paste phone numbers
                </Label>
                <Textarea
                  id="bulk-phones"
                  value={customPhones}
                  onChange={(e) => setCustomPhones(e.target.value)}
                  placeholder="+233..., one per line or comma-separated"
                  rows={2}
                  className="mt-1.5 text-sm font-mono resize-none"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Added at send time · counts toward the {data.maxRecipients}-recipient limit
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-2">
                <p className="text-xs font-semibold">Add contact</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                    className="h-9 text-sm font-mono"
                  />
                  <Input
                    placeholder="Email"
                    value={newContact.email}
                    onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={atLimit || (!newContact.phone.trim() && !newContact.email.trim())}
                  onClick={addCustomContact}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add to list
                </Button>
              </div>

              {customContacts.length > 0 && (
                <ul className="space-y-1.5">
                  {customContacts.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                          {c.phone && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeCustomContact(c.id)}
                        aria-label={`Remove ${c.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-4">
            {totalSelected > 0 && (
              <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                      {totalSelected}
                    </span>
                    <span className="text-sm font-semibold">Ready to send</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-muted-foreground"
                    onClick={() => {
                      setSelected(new Set());
                      setCustomContacts([]);
                      setCustomPhones("");
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedUserIds.length} platform user{selectedUserIds.length === 1 ? "" : "s"}
                  {customContacts.length > 0
                    ? ` · ${customContacts.length} custom contact${customContacts.length === 1 ? "" : "s"}`
                    : ""}
                  {customPhones.trim() ? " · pasted phones included" : ""}
                </p>
              </div>
            )}

            <AdminCard title="Compose message" description="Templates with personalized merge tags" dense>
              <AdminOutreachComposeFields compose={compose} idPrefix="page-outreach" />
              <div className="mt-5 pt-4 border-t border-border/60">
                <SendOutreachButton
                  count={sendCount}
                  disabled={!compose.canSubmit || sendCount === 0}
                />
              </div>
            </AdminCard>
          </div>
        </div>
      </form>
    </AdminPage>
  );
}
