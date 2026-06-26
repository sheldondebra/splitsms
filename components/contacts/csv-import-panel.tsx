"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { importContactsSelectedAction } from "@/lib/actions/contacts";
import type { CsvContactRow, ImportPreviewRow } from "@/lib/contacts/csv-import";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";

type PreviewResponse = {
  rows: ImportPreviewRow[];
  valid: CsvContactRow[];
  invalid: { row: number; phone: string; reason: string }[];
  duplicates: number;
  totalRows: number;
  filename?: string;
  countryBreakdown?: Record<string, number>;
  error?: string;
};

function rowKey(row: ImportPreviewRow) {
  return `${row.rowIndex}-${row.phone}-${row.status}`;
}

export function CsvImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [csvPaste, setCsvPaste] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importPending, startImport] = useTransition();

  const validRows = useMemo(
    () => preview?.rows.filter((r) => r.status === "valid") ?? [],
    [preview],
  );
  const invalidRows = useMemo(
    () => preview?.rows.filter((r) => r.status === "invalid") ?? [],
    [preview],
  );

  const selectedRows = useMemo(() => {
    if (!preview) return [];
    return preview.rows.filter((r) => r.status === "valid" && selected.has(rowKey(r)));
  }, [preview, selected]);

  const selectedContacts: CsvContactRow[] = useMemo(
    () =>
      selectedRows.map((r) => ({
        name: r.name,
        phone: r.phone,
        email: r.email,
        countryCode: r.countryCode,
        tags: r.tags,
      })),
    [selectedRows],
  );

  function applyPreview(data: PreviewResponse, name?: string) {
    if (data.error) {
      setError(data.error);
      setPreview(null);
      return;
    }
    setError(null);
    setPreview(data);
    setFilename(name ?? data.filename ?? null);
    const defaults = new Set(
      data.rows.filter((r) => r.status === "valid").map((r) => rowKey(r)),
    );
    setSelected(defaults);
  }

  async function previewFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/dashboard/contacts/preview", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not read file");
        setPreview(null);
        return;
      }
      applyPreview(data, file.name);
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  async function previewPaste() {
    if (!csvPaste.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/contacts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvPaste }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setError(data.error ?? "Could not parse CSV");
        setPreview(null);
        return;
      }
      applyPreview(data, "pasted.csv");
    } finally {
      setLoading(false);
    }
  }

  function toggleRow(row: ImportPreviewRow) {
    if (row.status !== "valid") return;
    const key = rowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllValid(checked: boolean) {
    if (checked) {
      setSelected(new Set(validRows.map((r) => rowKey(r))));
    } else {
      setSelected(new Set());
    }
  }

  function resetPreview() {
    setPreview(null);
    setSelected(new Set());
    setFilename(null);
    setError(null);
    setCsvPaste("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImportConfirm() {
    startImport(async () => {
      const form = new FormData();
      form.set("contacts", JSON.stringify(selectedContacts));
      await importContactsSelectedAction(form);
    });
  }

  const allValidSelected = validRows.length > 0 && selectedRows.length === validRows.length;
  const someValidSelected = selectedRows.length > 0 && !allValidSelected;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">CSV or Excel</p>
            <p className="mt-1 leading-relaxed">
              Upload a <strong className="font-medium text-foreground">.csv</strong>,{" "}
              <strong className="font-medium text-foreground">.xlsx</strong>, or{" "}
              <strong className="font-medium text-foreground">.xls</strong> file. First row
              should be headers with a <code className="text-xs bg-muted px-1 rounded">phone</code>{" "}
              column. Optional: name, email, country, tags.
            </p>
          </div>
        </div>
      </div>

      {!preview ? (
        <>
          <label
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/70 bg-background px-6 py-10 cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5",
              loading && "pointer-events-none opacity-60",
              dragActive && "border-primary bg-primary/5",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void previewFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="sr-only"
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void previewFile(file);
              }}
            />
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {loading ? "Reading file…" : "Click to upload or drag a file here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Max 5 MB</p>
            </div>
          </label>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => setPasteMode((v) => !v)}
            >
              {pasteMode ? "Hide paste option" : "Or paste CSV instead"}
            </button>
          </div>

          {pasteMode ? (
            <div className="space-y-3">
              <Textarea
                value={csvPaste}
                onChange={(e) => setCsvPaste(e.target.value)}
                rows={6}
                placeholder="name,phone,email&#10;Jane,233201234567,jane@example.com"
                className="font-mono text-sm min-h-[120px]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={previewPaste}
                disabled={loading || !csvPaste.trim()}
                className="h-11 rounded-xl"
              >
                Preview pasted CSV
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {filename ?? "Import preview"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review rows below, uncheck any you do not want, then confirm import.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={resetPreview} className="gap-1">
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total rows" value={preview.totalRows} />
            <StatCard label="Valid" value={validRows.length} tone="success" />
            <StatCard label="Invalid" value={invalidRows.length} tone="danger" />
            <StatCard label="Selected to import" value={selectedRows.length} tone="primary" />
          </div>

          {preview.countryBreakdown && Object.keys(preview.countryBreakdown).length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Valid by country:{" "}
              {Object.entries(preview.countryBreakdown)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          ) : null}

          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={allValidSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someValidSelected;
                  }}
                  onChange={(e) => toggleAllValid(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Select all valid ({validRows.length})
              </label>
              <span className="text-xs text-muted-foreground">
                {invalidRows.length} invalid row{invalidRows.length === 1 ? "" : "s"} cannot be
                imported
              </span>
            </div>

            <div className="max-h-[min(420px,50vh)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => {
                    const key = rowKey(row);
                    const isValid = row.status === "valid";
                    const checked = isValid && selected.has(key);
                    return (
                      <TableRow
                        key={key}
                        className={cn(!isValid && "bg-destructive/5 opacity-90")}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!isValid}
                            onChange={() => toggleRow(row)}
                            className="h-4 w-4 rounded border-input accent-primary disabled:opacity-40"
                            aria-label={`Select row ${row.rowIndex}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {row.rowIndex}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {row.name ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {row.phone || row.phoneRaw || "—"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-xs">
                          {row.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">{row.countryCode ?? "—"}</TableCell>
                        <TableCell>
                          {isValid ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-destructive/30 text-destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {row.reason ?? "Invalid"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={resetPreview} className="h-11 rounded-xl">
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl font-semibold gap-2"
              disabled={selectedRows.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Review import ({selectedRows.length})
            </Button>
          </div>
        </>
      )}

      {error ? (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm import</DialogTitle>
            <DialogDescription>
              You are about to import contacts into your address book. Invalid rows are excluded.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-4">
              <span className="text-muted-foreground">Contacts to import</span>
              <span className="font-semibold tabular-nums">{selectedRows.length}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-muted-foreground">Valid in file</span>
              <span className="font-medium tabular-nums">{validRows.length}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invalid (skipped)</span>
              <span className="font-medium tabular-nums text-destructive">{invalidRows.length}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total rows in file</span>
              <span className="font-medium tabular-nums">{preview?.totalRows ?? 0}</span>
            </li>
          </ul>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Go back
            </Button>
            <Button
              type="button"
              onClick={handleImportConfirm}
              disabled={importPending || selectedRows.length === 0}
              className="gap-2"
            >
              {importPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>Import {selectedRows.length} contact{selectedRows.length === 1 ? "" : "s"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "success" && "border-emerald-500/25 bg-emerald-500/5",
        tone === "danger" && "border-destructive/25 bg-destructive/5",
        tone === "primary" && "border-primary/25 bg-primary/5",
        tone === "default" && "border-border/60 bg-muted/20",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-1">{value.toLocaleString()}</p>
    </div>
  );
}
