"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EMAIL_MARKETING_SITE_IMAGES } from "@/lib/admin/email-marketing-shared";
import { adminUploadEmailMarketingImageAction } from "@/lib/actions/admin-email-marketing";
import { cn } from "@/lib/utils";

export function EmailMarketingImageField({
  value,
  onChange,
  name = "imageUrl",
  id,
}: {
  value: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
}) {
  const fieldId = id ?? name;
  const [current, setCurrent] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setCurrent(value);
  }

  function setImage(next: string) {
    setCurrent(next);
    setError(null);
    onChange?.(next);
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
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={fieldId}>Header image</Label>
      <div className="flex items-stretch gap-2">
        {current ? (
          <div className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
        <Input
          id={fieldId}
          name={name}
          value={current}
          onChange={(e) => setImage(e.target.value)}
          placeholder="/og.png or https://…"
          className="min-w-0 flex-1"
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
        <input
          ref={fileRef}
          type="file"
          name="imageFile"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {EMAIL_MARKETING_SITE_IMAGES.map((img) => (
          <button
            key={img.href}
            type="button"
            onClick={() => setImage(img.href)}
            className={cn(
              "overflow-hidden rounded-lg border bg-background",
              current === img.href ? "border-primary ring-2 ring-primary/30" : "border-border/70",
            )}
            title={img.label}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.href} alt={img.label} className="h-12 w-20 object-cover" />
          </button>
        ))}
      </div>
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Upload PNG, JPG, WEBP, or GIF (2 MB max), pick a site image, or paste a URL.
        </p>
      )}
    </div>
  );
}
