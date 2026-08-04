"use client";

import { useState, useTransition } from "react";
import { importContactsSelectedAction } from "@/lib/actions/contacts";
import type { CsvContactRow } from "@/lib/contacts/csv-import";
import type { DriveSpreadsheetFile } from "@/lib/google/sheets";
import { GOOGLE_SHEETS_SCOPES } from "@/lib/google/scopes";
import { googleConnectHref } from "@/lib/google/connect-url";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, Loader2 } from "lucide-react";

type PreviewResponse = {
  contacts: CsvContactRow[];
  sendUrl: string;
  header: string[];
  error?: string;
  connectUrl?: string;
};

export function GoogleSheetsImportPanel({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DriveSpreadsheetFile[] | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const defaultConnect = googleConnectHref({
    scopes: [...GOOGLE_SHEETS_SCOPES],
    returnTo: "/dashboard/contacts?tab=import",
  });

  async function loadFiles() {
    setLoading(true);
    setError(null);
    setConnectUrl(null);
    setPreview(null);
    try {
      const res = await fetch("/api/dashboard/google/sheets");
      const data = await res.json();
      if (!res.ok) {
        setConnectUrl(data.connectUrl ?? null);
        setError(
          data.error === "not_connected"
            ? "Connect Google first."
            : "Grant Sheets & Drive access to continue.",
        );
        return;
      }
      setFiles(data.files ?? []);
    } catch {
      setError("Could not list Google files.");
    } finally {
      setLoading(false);
    }
  }

  async function previewFile(id: string) {
    setSelectedId(id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/google/sheets/preview?id=${encodeURIComponent(id)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setConnectUrl(data.connectUrl ?? null);
        setError("Could not read that spreadsheet.");
        return;
      }
      setPreview(data);
    } catch {
      setError("Could not read that spreadsheet.");
    } finally {
      setLoading(false);
    }
  }

  function importContacts() {
    if (!preview?.contacts?.length) return;
    const fd = new FormData();
    fd.set("contacts", JSON.stringify(preview.contacts));
    startTransition(async () => {
      await importContactsSelectedAction(fd);
    });
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Import from Google Sheets
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a Google Sheet from Drive, then import contacts or open Send SMS.
            (Upload Excel as CSV, or open it in Google Sheets first.)
          </p>
        </div>
        {!connected ? (
          <a href={defaultConnect} className={cn(buttonVariants({ size: "sm" }))}>
            Connect Google
          </a>
        ) : (
          <Button type="button" size="sm" onClick={loadFiles} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Browse Google Drive"}
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

      {files && (
        <div className="space-y-2 max-h-48 overflow-auto">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Google Sheets found in Drive.</p>
          ) : (
            files.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => previewFile(f.id)}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2 text-sm hover:bg-muted/50",
                  selectedId === f.id && "border-primary bg-primary/5",
                )}
              >
                {f.name}
              </button>
            ))
          )}
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">{preview.contacts.length} phone numbers</Badge>
            <Button
              type="button"
              size="sm"
              onClick={importContacts}
              disabled={!preview.contacts.length || pending}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import as contacts"}
            </Button>
            {preview.contacts.length > 0 && (
              <a
                href={preview.sendUrl}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Send SMS
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
