"use client";

import { useState } from "react";
import { importContactsCsvAction } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Upload } from "lucide-react";

type Preview = {
  valid: { name?: string; phone: string; email?: string; countryCode?: string; tags?: string }[];
  invalid: { row: number; phone: string; reason: string }[];
  duplicates: number;
  totalRows: number;
  countryBreakdown?: Record<string, number>;
  sample?: Preview["valid"];
};

export function CsvImportPanel() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/contacts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      setPreview(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">CSV format</p>
            <p className="mt-1 leading-relaxed">
              First row = headers. Required column: <code className="text-xs bg-muted px-1 rounded">phone</code>.
              Optional: name, email, country, tags.
            </p>
            <pre className="mt-2 text-[11px] font-mono bg-background rounded-lg border p-2 overflow-x-auto">
              name,phone,email,country,tags{"\n"}Jane,233201234567,jane@example.com,GH,vip
            </pre>
          </div>
        </div>
      </div>

      <Textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={8}
        placeholder="Paste CSV content here…"
        className="min-h-[160px] font-mono text-sm resize-y"
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={loading || !csv.trim()}
          className="h-11 rounded-xl"
        >
          {loading ? "Checking…" : "Preview import"}
        </Button>
        {preview && preview.valid.length > 0 ? (
          <form action={importContactsCsvAction} className="flex-1 sm:flex-initial">
            <input type="hidden" name="csv" value={csv} />
            <Button type="submit" className="h-11 w-full sm:w-auto rounded-xl font-semibold gap-2">
              <Upload className="h-4 w-4" />
              Import {preview.valid.length} contacts
            </Button>
          </form>
        ) : null}
      </div>

      {preview ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-4 text-sm">
          <p className="font-semibold text-foreground">Preview results</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{preview.valid.length} ready to import</Badge>
            <Badge variant="outline">{preview.invalid.length} invalid</Badge>
            <Badge variant="outline">{preview.duplicates} duplicates skipped</Badge>
          </div>
          {preview.countryBreakdown && Object.keys(preview.countryBreakdown).length > 0 ? (
            <p className="text-muted-foreground text-xs">
              By country:{" "}
              {Object.entries(preview.countryBreakdown)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          ) : null}
          {preview.invalid.length > 0 ? (
            <ul className="text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
              {preview.invalid.slice(0, 5).map((row) => (
                <li key={row.row}>
                  Row {row.row}: {row.reason} ({row.phone || "empty"})
                </li>
              ))}
              {preview.invalid.length > 5 ? (
                <li>…and {preview.invalid.length - 5} more</li>
              ) : null}
            </ul>
          ) : null}
          {preview.sample && preview.sample.length > 0 ? (
            <ul className="max-h-32 overflow-y-auto space-y-1 font-mono text-xs text-muted-foreground border-t border-border/60 pt-3">
              {preview.sample.map((r, i) => (
                <li key={i}>
                  {r.name ?? "—"} · {r.phone}
                  {r.countryCode ? ` · ${r.countryCode}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
