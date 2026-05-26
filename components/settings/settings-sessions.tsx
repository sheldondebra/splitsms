import { format, formatDistanceToNow } from "date-fns";
import {
  MobileCardList,
  MobileCardItem,
  AppCard,
  AppCardBody,
} from "@/components/dashboard/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Monitor, Smartphone } from "lucide-react";

export type SessionRow = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  lastActiveAt: Date;
};

import { parseUserAgent } from "@/lib/user-agent";

function parseDevice(userAgent: string | null) {
  const p = parseUserAgent(userAgent);
  return { label: p.label, mobile: p.mobile };
}

function SessionIcon({ mobile }: { mobile: boolean }) {
  const Icon = mobile ? Smartphone : Monitor;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function SettingsSessions({
  sessions,
  sessionCount,
}: {
  sessions: SessionRow[];
  sessionCount: number;
}) {
  if (!sessions.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No session history yet. You have {sessionCount} active session
        {sessionCount === 1 ? "" : "s"} on this account.
      </p>
    );
  }

  return (
    <>
      <MobileCardList>
        {sessions.map((s) => {
          const device = parseDevice(s.userAgent);
          return (
            <MobileCardItem key={s.id} className="overflow-hidden p-0">
              <div className="flex items-start gap-3 p-4">
                <SessionIcon mobile={device.mobile} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{device.label}</p>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">IP</dt>
                      <dd className="font-mono text-foreground">{s.ip ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Last active</dt>
                      <dd className="text-right text-foreground">
                        {formatDistanceToNow(s.lastActiveAt, { addSuffix: true })}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Signed in</dt>
                      <dd className="text-foreground">{format(s.createdAt, "MMM d, yyyy")}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </MobileCardItem>
          );
        })}
      </MobileCardList>

      <AppCard className="hidden overflow-hidden md:block">
        <AppCardBody className="p-0 sm:p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Device</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Signed in</TableHead>
                <TableHead className="text-right">Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => {
                const device = parseDevice(s.userAgent);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <SessionIcon mobile={device.mobile} />
                        <span className="text-sm font-medium">{device.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.ip ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(s.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDistanceToNow(s.lastActiveAt, { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </AppCardBody>
      </AppCard>

      {sessionCount > sessions.length && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {sessions.length} recent of {sessionCount} total sessions.
        </p>
      )}
    </>
  );
}
