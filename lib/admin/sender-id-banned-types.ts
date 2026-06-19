import type {
  BannedSenderEntry,
  SenderIdReservedConfig,
} from "@/lib/sender-ids/reserved-names";

export type FlaggedRejectedSender = {
  id: string;
  value: string;
  countryCode: string;
  adminNote: string | null;
  createdAt: Date;
  user: { id: string; fullName: string; phone: string };
};

export type AdminBannedSendersDashboard = {
  config: SenderIdReservedConfig;
  builtIn: { builtInExactCount: number; builtInPrefixCount: number };
  flaggedRejected: FlaggedRejectedSender[];
};

export function sortBannedEntries(entries: BannedSenderEntry[]): BannedSenderEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime(),
  );
}
