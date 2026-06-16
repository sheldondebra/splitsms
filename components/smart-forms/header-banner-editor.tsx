"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { FormHeaderBanner } from "@/components/smart-forms/form-header-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  compressBannerImage,
  DEFAULT_BANNER_POSITION,
  formatBannerBytes,
  type BannerPosition,
} from "@/lib/smart-forms/banner-image";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

type HeaderBannerEditorProps = {
  bannerUrl: string;
  position: BannerPosition;
  onBannerUrlChange: (url: string) => void;
  onPositionChange: (position: BannerPosition) => void;
};

export function HeaderBannerEditor({
  bannerUrl,
  position,
  onBannerUrlChange,
  onPositionChange,
}: HeaderBannerEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const hasBanner = Boolean(bannerUrl.trim());

  function handleFile(file: File | null) {
    if (!file) return;
    startTransition(async () => {
      try {
        const dataUrl = await compressBannerImage(file);
        onBannerUrlChange(dataUrl);
        onPositionChange(DEFAULT_BANNER_POSITION);
        toast.success(`Image compressed (${formatBannerBytes(dataUrl.length)})`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not process image.");
      }
    });
  }

  function handleRemove() {
    onBannerUrlChange("");
    onPositionChange(DEFAULT_BANNER_POSITION);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Header image</Label>
        {hasBanner ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-destructive hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>

      {hasBanner ? (
        <div className="overflow-hidden rounded-xl border bg-zinc-50">
          <FormHeaderBanner
            src={bannerUrl.trim()}
            position={position}
            interactive
            onPositionChange={onPositionChange}
            heightClass="h-36"
          />
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-zinc-50",
            isPending && "pointer-events-none opacity-60",
          )}
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isPending ? "Compressing image…" : "Upload header image"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              JPG, PNG, or WebP · auto-compressed · max 15 MB
            </p>
          </div>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {hasBanner ? "Replace image" : "Choose file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={isPending}
          onChange={(e) => {
            handleFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-2 pt-1">
        <Label className="text-xs text-muted-foreground">Or paste image URL</Label>
        <Input
          value={bannerUrl.startsWith("data:") ? "" : bannerUrl}
          onChange={(e) => {
            onBannerUrlChange(e.target.value);
            if (e.target.value.trim()) {
              onPositionChange(DEFAULT_BANNER_POSITION);
            }
          }}
          placeholder="https://yoursite.com/banner.jpg"
          className="h-10 text-sm"
        />
        {bannerUrl.startsWith("data:") ? (
          <p className="text-xs text-muted-foreground">
            Uploaded image saved ({formatBannerBytes(bannerUrl.length)}). Use Replace to change it.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Wide images work best (about 3:1). Drag the preview above to reposition after upload.
          </p>
        )}
      </div>
    </div>
  );
}
