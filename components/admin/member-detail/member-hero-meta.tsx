import { format, formatDistanceToNow } from "date-fns";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Copy,
  Hash,
  Link2,
  MapPin,
  Puzzle,
  Store,
  UserPlus,
} from "lucide-react";

const SOURCE_ICONS = {
  connect: Link2,
  wordpress: Puzzle,
  reseller: Store,
  direct: UserPlus,
} as const;

type Props = {
  data: AdminMemberDetail;
  copied: boolean;
  onCopyId: () => void;
};

export function MemberHeroMeta({ data, copied, onCopyId }: Props) {
  const { user, acquisition } = data;
  const SourceIcon = SOURCE_ICONS[acquisition.source] ?? UserPlus;
  const lastActive = data.sessions[0]?.lastActiveAt;
  const memberId = user.accountId;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/40 border-t border-border/40 bg-background/50">
      <div className="flex items-start gap-2.5 px-3.5 py-3 min-w-0">
        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Member since
          </p>
          <p className="mt-0.5 text-sm font-semibold truncate">
            {format(user.createdAt, "MMM d, yyyy")}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
            {formatDistanceToNow(user.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 px-3.5 py-3 min-w-0">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Country
          </p>
          <p className="mt-0.5 text-sm font-semibold truncate">{user.countryName}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
            {user.countryCode}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 px-3.5 py-3 min-w-0">
        <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Member ID
          </p>
          <button
            type="button"
            onClick={onCopyId}
            title={`Member ID ${memberId}`}
            className={cn(
              "mt-0.5 flex w-full max-w-full items-center gap-1.5 rounded-md text-left transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            <span className="font-mono text-sm font-semibold tracking-wider tabular-nums">
              {memberId}
            </span>
            <span
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/80",
                copied &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </span>
          </button>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {copied ? "Copied" : "Click to copy"}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 px-3.5 py-3 min-w-0">
        <SourceIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Acquisition
          </p>
          <p className="mt-0.5 text-sm font-semibold truncate">{acquisition.sourceLabel}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
            {lastActive
              ? `Last active ${formatDistanceToNow(lastActive, { addSuffix: true })}`
              : "No sessions recorded"}
          </p>
        </div>
      </div>
    </div>
  );
}
