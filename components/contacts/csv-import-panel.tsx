"use client";

import { useState } from "react";
import { importContactsCsvAction } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
      <Textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder={"name,phone,email,country,tags\nJohn,+233201234567,john@example.com,GH,vip"}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handlePreview} disabled={loading || !csv.trim()}>
          {loading ? "Parsing…" : "Preview import"}
        </Button>
        {preview && (
          <form action={importContactsCsvAction}>
            <input type="hidden" name="csv" value={csv} />
            <Button type="submit">Save {preview.valid.length} contacts</Button>
          </form>
        )}
      </div>
      {preview && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{preview.valid.length} valid</Badge>
            <Badge variant="outline">{preview.invalid.length} invalid</Badge>
            <Badge variant="outline">{preview.duplicates} duplicates skipped</Badge>
          </div>
          {preview.countryBreakdown && (
            <p className="text-muted-foreground">
              Countries:{" "}
              {Object.entries(preview.countryBreakdown)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          )}
          {preview.sample && preview.sample.length > 0 && (
            <ul className="max-h-32 overflow-y-auto space-y-1 font-mono text-xs">
              {preview.sample.map((r, i) => (
                <li key={i}>
                  {r.name ?? "—"} · {r.phone} {r.countryCode ? `· ${r.countryCode}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
