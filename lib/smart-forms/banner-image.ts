export type BannerPosition = { x: number; y: number };

export const DEFAULT_BANNER_POSITION: BannerPosition = { x: 50, y: 50 };

export function bannerObjectPosition(position?: Partial<BannerPosition>): string {
  const x = clampPercent(position?.x ?? DEFAULT_BANNER_POSITION.x);
  const y = clampPercent(position?.y ?? DEFAULT_BANNER_POSITION.y);
  return `${x}% ${y}%`;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function formatBannerBytes(chars: number): string {
  const bytes = Math.ceil((chars * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function compressBannerImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP).");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Image must be under 15 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxWidth = 1600;
    const maxHeight = 640;
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image.");

    const render = (w: number, h: number, quality: number) => {
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", quality);
    };

    let quality = 0.86;
    let dataUrl = render(width, height, quality);

    while (dataUrl.length > 520_000 && quality > 0.52) {
      quality -= 0.07;
      dataUrl = render(width, height, quality);
    }

    while (dataUrl.length > 520_000 && width > 800) {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
      dataUrl = render(width, height, quality);
    }

    if (dataUrl.length > 750_000) {
      throw new Error("Image is still too large after compression. Try a smaller file.");
    }

    return dataUrl;
  } finally {
    bitmap.close();
  }
}
