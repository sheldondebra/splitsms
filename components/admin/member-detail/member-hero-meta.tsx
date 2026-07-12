import { format, formatDistanceToNow } from "date-fns";
import { DetailTile } from "@/components/admin/member-detail/member-detail-ui";
import type { AdminMemberDetail } from "@/lib/admin/member-detail";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Copy,
  Fingerprint,
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

  return (
    <div className="space-y-3 border-t border-border/50 pt-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <DetailTile
          icon={Calendar}
          label="Member since"
          value={format(user.createdAt, "MMM d, yyyy")}
          hint={formatDistanceToNow(user.createdAt, { addSuffix: true })}
        />
        <DetailTile
          icon={MapPin}
          label="Country"
          value={user.countryName}
          hint={user.countryCode}
        />
        <div className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 min-w-0 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Fingerprint className="h-3 w-3 shrink-0" />
            <span>Member ID</span>
          </div>
          <button
            type="button"
            onClick={onCopyId}
            title={user.id}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-md text-left transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold">{user.id}</span>
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/80",
                copied && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </span>
          </button>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {copied ? "Copied to clipboard" : "Click to copy full ID"}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 min-w-0 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <SourceIcon className="h-3 w-3 shrink-0" />
            <span>Acquisition</span>
          </div>
          <p className="mt-1 text-sm font-semibold truncate">{acquisition.sourceLabel}</p>
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
