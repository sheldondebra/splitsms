import { getUserInitials } from "@/lib/user/display";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  src?: string | null;
};

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
} as const;

export function UserAvatar({ name, className, size = "sm", src }: UserAvatarProps) {
  const initials = getUserInitials(name);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className={cn(
          "inline-block shrink-0 rounded-full object-cover ring-2 ring-background",
          sizeClass[size],
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 font-semibold uppercase text-primary ring-2 ring-background",
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
