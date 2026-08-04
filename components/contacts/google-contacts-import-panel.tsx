"use client";

import { useMemo, useState, useTransition } from "react";
import { importContactsSelectedAction } from "@/lib/actions/contacts";
import type { GooglePersonContact } from "@/lib/google/people";
import { GOOGLE_CONTACTS_IMPORT_SCOPES } from "@/lib/google/scopes";
import { googleConnectHref } from "@/lib/google/connect-url";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { CheckCircle2, Loader2, Users } from "lucide-react";

type ListResponse =
  | { contacts: GooglePersonContact[] }
  | {
      error: string;
      connectUrl?: string;
      missingScopes?: string[];
    };

export function GoogleContactsImportPanel({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [contacts, setContacts] = useState<GooglePersonContact[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importPending, startImport] = useTransition();

  const allKeys = useMemo(
    () => contacts?.map((c) => c.resourceName) ?? [],
    [contacts],
  );

  async function loadContacts() {
    setLoading(true);
    setError(null);
    setConnectUrl(null);
    try {
      const res = await fetch("/api/dashboard/contacts/google");
      const data = (await res.json()) as ListResponse;
      if (!res.ok) {
        if ("connectUrl" in data && data.connectUrl) {
          setConnectUrl(data.connectUrl);
          setError(
            data.error === "needs_scopes"
              ? "Grant Google Contacts access to continue."
              : data.error === "not_connected"
                ? "Connect Google first."
                : "Reconnect Google to continue.",
          );
        } else {
          setError("Could not load Google contacts.");
        }
        setContacts(null);
        return;
      }
      if (!("contacts" in data)) {
        setError("Could not load Google contacts.");
        return;
      }
      setContacts(data.contacts);
      setSelected(new Set(data.contacts.map((c) => c.resourceName)));
    } catch {
      setError("Could not load Google contacts.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allKeys));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function confirmImport() {
    if (!contacts) return;
    const rows = contacts
      .filter((c) => selected.has(c.resourceName))
      .map((c) => ({
        phone: c.phone,
        name: c.name ?? undefined,
        email: c.email ?? undefined,
        countryCode: c.countryCode ?? undefined,
      }));
    if (rows.length === 0) return;

    const fd = new FormData();
    fd.set("contacts", JSON.stringify(rows));
    startImport(async () => {
      await importContactsSelectedAction(fd);
    });
  }

  const defaultConnect = googleConnectHref({
    scopes: [...GOOGLE_CONTACTS_IMPORT_SCOPES],
    returnTo: "/dashboard/contacts?tab=import",
  });

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Import from Google Contacts
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Load contacts with phone numbers, then select one or select all to import.
          </p>
        </div>
        {!connected ? (
          <a href={defaultConnect} className={cn(buttonVariants({ size: "sm" }))}>
            Connect Google
          </a>
        ) : (
          <Button type="button" size="sm" onClick={loadContacts} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Google contacts"}
          </Button>
        )}
      </div>

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          {connectUrl && (
            <a href={connectUrl} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              Grant access
            </a>
          )}
        </div>
      )}

      {contacts && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{contacts.length} with phone</Badge>
            <Badge variant="outline">{selected.size} selected</Badge>
            <Button type="button" size="sm" variant="ghost" onClick={selectAll}>
              Select all
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={selectNone}>
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmImport}
              disabled={selected.size === 0 || importPending}
              className="ml-auto gap-2"
            >
              {importPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Import selected
            </Button>
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.resourceName}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(c.resourceName)}
                        onChange={() => toggle(c.resourceName)}
                        aria-label={`Select ${c.name ?? c.phone}`}
                      />
                    </TableCell>
                    <TableCell>{c.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.email ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
