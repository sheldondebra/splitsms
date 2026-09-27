"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { adminUploadEmailMarketingImageAction } from "@/lib/actions/admin-email-marketing";

export function EmailBrandingImageField({
  value,
  onChange,
  name,
  id,
  label = "Image",
  hint = "Upload PNG, JPG, WEBP, or GIF (2 MB max), or paste a public HTTPS URL.",
}: {
  value: string;
  onChange?: (value: string) => void;
  name: string;
  id?: string;
  label?: string;
  hint?: string;
}) {
  const fieldId = id ?? name;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setImage(next: string) {
    onChange?.(next);
    setError(null);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await adminUploadEmailMarketingImageAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setImage(result.url);
    } catch {
      setError("Could not upload that image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="flex items-stretch gap-2">
        {value ? (
          <div className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
        <Input
          id={fieldId}
          name={name}
          value={value}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://… or /api/email-marketing/blob/…"
          className="min-w-0 flex-1 font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 gap-1.5"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setImage("")}
            aria-label="Clear image"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
