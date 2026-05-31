import { getUserInitials } from "@/lib/user/display";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-sm",
} as const;

export function UserAvatar({ name, className, size = "sm" }: UserAvatarProps) {
  const initials = getUserInitials(name);
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
