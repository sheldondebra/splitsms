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
  const remoteUrl = bannerUrl.startsWith("data:") ? "" : bannerUrl;

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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label>Header image</Label>
        {hasBanner ? (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex h-7 items-center gap-1 text-xs font-medium text-destructive hover:underline"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        ) : null}
      </div>

      {hasBanner ? (
        <div className="overflow-hidden rounded-xl border bg-zinc-50">
          <FormHeaderBanner
            src={bannerUrl.trim()}
            position={position}
            interactive
            onPositionChange={onPositionChange}
            heightClass="h-28"
          />
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "flex h-[5.5rem] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-3 text-left transition-colors hover:border-primary/40 hover:bg-zinc-50",
            isPending && "pointer-events-none opacity-60",
          )}
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {isPending ? "Compressing…" : "Upload image"}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              JPG, PNG, or WebP · 15 MB max
            </span>
          </span>
        </button>
      )}

      <div className="flex gap-2">
        {hasBanner ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Replace
          </Button>
        ) : null}
        <Input
          value={remoteUrl}
          onChange={(e) => {
            onBannerUrlChange(e.target.value);
            if (e.target.value.trim()) onPositionChange(DEFAULT_BANNER_POSITION);
          }}
          placeholder="Or paste image URL"
          className="h-8 text-xs"
        />
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
      {hasBanner ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Drag the preview to reposition.
        </p>
      ) : null}
    </div>
  );
}
