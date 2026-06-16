"use client";

import { useCallback, useRef, useState } from "react";
import {
  bannerObjectPosition,
  clampPercent,
  type BannerPosition,
} from "@/lib/smart-forms/banner-image";
import { cn } from "@/lib/utils";
import { Move } from "lucide-react";

type FormHeaderBannerProps = {
  src: string;
  position?: Partial<BannerPosition>;
  heightClass?: string;
  interactive?: boolean;
  onPositionChange?: (position: BannerPosition) => void;
  onClick?: () => void;
  className?: string;
  alt?: string;
};

export function FormHeaderBanner({
  src,
  position,
  heightClass = "h-32 sm:h-36",
  interactive = false,
  onPositionChange,
  onClick,
  className,
  alt = "Form header",
}: FormHeaderBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const posX = clampPercent(position?.x ?? 50);
  const posY = clampPercent(position?.y ?? 50);
  const objectPosition = bannerObjectPosition({ x: posX, y: posY });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !onPositionChange) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY, posX, posY };
      setDragging(true);
    },
    [interactive, onPositionChange, posX, posY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || !onPositionChange) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      const nextX = clampPercent(dragRef.current.posX - (dx / rect.width) * 55);
      const nextY = clampPercent(dragRef.current.posY - (dy / rect.height) * 55);

      onPositionChange({ x: nextX, y: nextY });
    },
    [onPositionChange],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
  }, []);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative block w-full overflow-hidden bg-zinc-100",
        heightClass,
        onClick && "text-left",
        interactive && "touch-none select-none",
        className,
      )}
    >
      <div
        ref={containerRef}
        className={cn("relative h-full w-full", interactive && "cursor-grab", dragging && "cursor-grabbing")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          style={{ objectPosition }}
        />
        {interactive ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-[11px] font-medium text-white transition-opacity",
              dragging ? "opacity-100" : "opacity-80",
            )}
          >
            <Move className="h-3 w-3" aria-hidden />
            Drag to reposition
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}
