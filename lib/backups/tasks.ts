import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getAdminNumbersDashboard, NUMBERS_EXPORT_LIMIT } from "@/lib/admin/numbers-dashboard";
import { numbersToCsv } from "@/lib/admin/numbers-list-url";
import type { BackupCategoryId, BackupFilters } from "@/lib/backups/types";
import { BATCH_SIZE } from "@/lib/backups/types";

export type BackupTaskId =
  | "members"
  | "settings"
  | "sender_ids"
  | "email_templates"
  | "email_campaigns"
  | "email_subscribers"
  | "messages"
  | "numbers";

export const TASK_CATEGORY: Record<BackupTaskId, BackupCategoryId> = {
  members: "MEMBERS",
  settings: "SETTINGS",
  sender_ids: "SENDER_IDS",
  email_templates: "EMAILS",
  email_campaigns: "EMAILS",
  email_subscribers: "EMAILS",
  messages: "MESSAGES",
  numbers: "NUMBERS",
};

export type RestoreResult = { inserted: number; skipped: number };

export type BackupTask = {
  id: BackupTaskId;
  filename: string;
  kind: "json" | "csv";
  count(filters: BackupFilters): Promise<number>;
  exportBatch?(
    cursor: string | null,
    filters: BackupFilters,
  ): Promise<{ rows: unknown[]; nextCursor: string | null; done: boolean }>;
  exportAll?(filters: BackupFilters): Promise<string>;
  restoreBatch?(rows: unknown[]): Promise<RestoreResult>;
};

async function tryCreate<T>(fn: () => Promise<T>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Members — User bundled with its account, wallet, credit, contacts, groups.
// ---------------------------------------------------------------------------

const memberInclude = {
  memberAccount: true,
  wallet: true,
  smsCredit: true,
  contacts: true,
  contactGroups: true,
} satisfies Prisma.UserInclude;

const membersTask: BackupTask = {
  id: "members",
  filename: "members.json",
  kind: "json",
  async count() {
    return prisma.user.count({ where: { role: "MEMBER" } });
  },
  async exportBatch(cursor) {
    const users = await prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: memberInclude,
    });
    const rows = users.map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _omit, ...safe } = u;
      return safe;
    });
    const nextCursor = users.length === BATCH_SIZE ? users[users.length - 1]!.id : null;
    return { rows, nextCursor, done: users.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as Record<string, unknown>[]) {
      const existing = await prisma.user.findUnique({ where: { id: row.id as string } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const ok = await tryCreate(() =>
        prisma.user.create({
          data: {
            id: row.id as string,
            accountNumber: (row.accountNumber as number | null) ?? undefined,
            fullName: row.fullName as string,
            phone: row.phone as string,
            countryCode: row.countryCode as string,
            // Restored members have no password — they must reset it.
            passwordHash: "restored-no-password",
            role: (row.role as "MEMBER" | "ADMIN" | "SUPER_ADMIN") ?? "MEMBER",
            staffPermissions: (row.staffPermissions as string[]) ?? [],
            referralCode: (row.referralCode as string | null) ?? undefined,
            email: (row.email as string | null) ?? undefined,
            googleId: (row.googleId as string | null) ?? undefined,
            isVerified: Boolean(row.isVerified),
            createdAt: row.createdAt ? new Date(row.createdAt as string) : undefined,
          },
        }),
      );
      if (!ok) {
        skipped += 1;
        continue;
      }
      inserted += 1;

      const memberAccount = row.memberAccount as Record<string, unknown> | null;
      if (memberAccount) {
        await tryCreate(() =>
          prisma.memberAccount.create({
            data: { ...memberAccount, userId: row.id as string } as Prisma.MemberAccountUncheckedCreateInput,
          }),
        );
      }
      const wallet = row.wallet as Record<string, unknown> | null;
      if (wallet) {
        await tryCreate(() =>
          prisma.wallet.create({
            data: { ...wallet, userId: row.id as string } as Prisma.WalletUncheckedCreateInput,
          }),
        );
      }
      const smsCredit = row.smsCredit as Record<string, unknown> | null;
      if (smsCredit) {
        await tryCreate(() =>
          prisma.smsCredit.create({
            data: { ...smsCredit, userId: row.id as string } as Prisma.SmsCreditUncheckedCreateInput,
          }),
        );
      }
      for (const contact of (row.contacts as Record<string, unknown>[]) ?? []) {
        await tryCreate(() =>
          prisma.contact.create({
            data: { ...contact, userId: row.id as string } as Prisma.ContactUncheckedCreateInput,
          }),
        );
      }
      for (const group of (row.contactGroups as Record<string, unknown>[]) ?? []) {
        await tryCreate(() =>
          prisma.contactGroup.create({
            data: { ...group, userId: row.id as string } as Prisma.ContactGroupUncheckedCreateInput,
          }),
        );
      }
    }
    return { inserted, skipped };
  },
};

// ---------------------------------------------------------------------------
// Settings — PlatformSetting key/value rows.
// ---------------------------------------------------------------------------

const settingsTask: BackupTask = {
  id: "settings",
  filename: "settings.json",
  kind: "json",
  async count() {
    return prisma.platformSetting.count();
  },
  async exportBatch(cursor) {
    const rows = await prisma.platformSetting.findMany({
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = rows.length === BATCH_SIZE ? rows[rows.length - 1]!.id : null;
    return { rows, nextCursor, done: rows.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as { key: string; value: unknown }[]) {
      const existing = await prisma.platformSetting.findUnique({ where: { key: row.key } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const ok = await tryCreate(() =>
        prisma.platformSetting.create({ data: { key: row.key, value: row.value as Prisma.InputJsonValue } }),
      );
      if (ok) inserted += 1;
      else skipped += 1;
    }
    return { inserted, skipped };
  },
};

// ---------------------------------------------------------------------------
// Sender IDs — bundled with provider registrations + verification documents.
// ---------------------------------------------------------------------------

const senderIdsTask: BackupTask = {
  id: "sender_ids",
  filename: "sender-ids.json",
  kind: "json",
  async count() {
    return prisma.senderId.count();
  },
  async exportBatch(cursor) {
    const senders = await prisma.senderId.findMany({
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { providerRegistrations: true, verificationDocuments: true },
    });
    const rows = senders.map((s) => ({
      ...s,
      verificationDocuments: s.verificationDocuments.map((d) => ({
        ...d,
        content: Buffer.from(d.content).toString("base64"),
      })),
    }));
    const nextCursor = senders.length === BATCH_SIZE ? senders[senders.length - 1]!.id : null;
    return { rows, nextCursor, done: senders.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as Record<string, unknown>[]) {
      const existing = await prisma.senderId.findUnique({ where: { id: row.id as string } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const { providerRegistrations, verificationDocuments, ...senderFields } = row;
      const ok = await tryCreate(() =>
        prisma.senderId.create({ data: senderFields as Prisma.SenderIdCreateInput }),
      );
      if (!ok) {
        skipped += 1;
        continue;
      }
      inserted += 1;
      for (const reg of (providerRegistrations as Record<string, unknown>[]) ?? []) {
        await tryCreate(() =>
          prisma.senderIdProviderRegistration.create({
            data: {
              ...reg,
              senderId: row.id as string,
            } as Prisma.SenderIdProviderRegistrationUncheckedCreateInput,
          }),
        );
      }
      for (const doc of (verificationDocuments as Record<string, unknown>[]) ?? []) {
        await tryCreate(() =>
          prisma.senderIdVerificationDocument.create({
            data: {
              ...doc,
              senderId: row.id as string,
              content: Buffer.from(doc.content as string, "base64"),
            } as unknown as Prisma.SenderIdVerificationDocumentUncheckedCreateInput,
          }),
        );
      }
    }
    return { inserted, skipped };
  },
};

// ---------------------------------------------------------------------------
// Emails — templates, campaigns (with deliveries), subscribers.
// ---------------------------------------------------------------------------

const emailTemplatesTask: BackupTask = {
  id: "email_templates",
  filename: "email-templates.json",
  kind: "json",
  async count() {
    return prisma.emailMarketingTemplate.count();
  },
  async exportBatch(cursor) {
    const rows = await prisma.emailMarketingTemplate.findMany({
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = rows.length === BATCH_SIZE ? rows[rows.length - 1]!.id : null;
    return { rows, nextCursor, done: rows.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as Record<string, unknown>[]) {
      const existing = await prisma.emailMarketingTemplate.findUnique({ where: { id: row.id as string } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const ok = await tryCreate(() =>
        prisma.emailMarketingTemplate.create({ data: row as Prisma.EmailMarketingTemplateCreateInput }),
      );
      if (ok) inserted += 1;
      else skipped += 1;
    }
    return { inserted, skipped };
  },
};

const emailCampaignsTask: BackupTask = {
  id: "email_campaigns",
  filename: "email-campaigns.json",
  kind: "json",
  async count() {
    return prisma.emailMarketingCampaign.count();
  },
  async exportBatch(cursor) {
    const campaigns = await prisma.emailMarketingCampaign.findMany({
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { deliveries: true },
    });
    const nextCursor = campaigns.length === BATCH_SIZE ? campaigns[campaigns.length - 1]!.id : null;
    return { rows: campaigns, nextCursor, done: campaigns.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as Record<string, unknown>[]) {
      const existing = await prisma.emailMarketingCampaign.findUnique({ where: { id: row.id as string } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const { deliveries, ...campaignFields } = row;
      const ok = await tryCreate(() =>
        prisma.emailMarketingCampaign.create({
          data: campaignFields as Prisma.EmailMarketingCampaignCreateInput,
        }),
      );
      if (!ok) {
        skipped += 1;
        continue;
      }
      inserted += 1;
      for (const delivery of (deliveries as Record<string, unknown>[]) ?? []) {
        await tryCreate(() =>
          prisma.emailMarketingDelivery.create({
            data: {
              ...delivery,
              campaignId: row.id as string,
            } as Prisma.EmailMarketingDeliveryUncheckedCreateInput,
          }),
        );
      }
    }
    return { inserted, skipped };
  },
};

const emailSubscribersTask: BackupTask = {
  id: "email_subscribers",
  filename: "email-subscribers.json",
  kind: "json",
  async count() {
    return prisma.emailMarketingSubscriber.count();
  },
  async exportBatch(cursor) {
    const rows = await prisma.emailMarketingSubscriber.findMany({
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = rows.length === BATCH_SIZE ? rows[rows.length - 1]!.id : null;
    return { rows, nextCursor, done: rows.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as Record<string, unknown>[]) {
      const existing = await prisma.emailMarketingSubscriber.findUnique({ where: { id: row.id as string } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const ok = await tryCreate(() =>
        prisma.emailMarketingSubscriber.create({ data: row as Prisma.EmailMarketingSubscriberCreateInput }),
      );
      if (ok) inserted += 1;
      else skipped += 1;
    }
    return { inserted, skipped };
  },
};

// ---------------------------------------------------------------------------
// SMS Messages — filterable by status and date range. Highest row count.
// ---------------------------------------------------------------------------

function messageWhere(filters: BackupFilters): Prisma.MessageWhereInput {
  const where: Prisma.MessageWhereInput = {};
  if (filters.messageStatuses?.length) {
    where.status = { in: filters.messageStatuses as Prisma.EnumMessageStatusFilter["in"] };
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }
  return where;
}

const messagesTask: BackupTask = {
  id: "messages",
  filename: "messages.json",
  kind: "json",
  async count(filters) {
    return prisma.message.count({ where: messageWhere(filters) });
  },
  async exportBatch(cursor, filters) {
    const rows = await prisma.message.findMany({
      where: messageWhere(filters),
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const nextCursor = rows.length === BATCH_SIZE ? rows[rows.length - 1]!.id : null;
    return { rows, nextCursor, done: rows.length < BATCH_SIZE };
  },
  async restoreBatch(rows) {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows as Record<string, unknown>[]) {
      const existing = await prisma.message.findUnique({ where: { id: row.id as string } });
      if (existing) {
        skipped += 1;
        continue;
      }
      const { campaignId, ...rest } = row;
      const ok = await tryCreate(() =>
        prisma.message.create({
          data: {
            ...rest,
            campaignId: (campaignId as string | null) ?? undefined,
          } as Prisma.MessageUncheckedCreateInput,
        }),
      );
      if (ok) inserted += 1;
      else skipped += 1;
    }
    return { inserted, skipped };
  },
};

// ---------------------------------------------------------------------------
// Numbers — a derived report (User + Message join), no restore target.
// ---------------------------------------------------------------------------

const numbersTask: BackupTask = {
  id: "numbers",
  filename: "numbers.csv",
  kind: "csv",
  async count() {
    return 1;
  },
  async exportAll() {
    const data = await getAdminNumbersDashboard({ exportLimit: NUMBERS_EXPORT_LIMIT });
    return numbersToCsv(data.numbers);
  },
};

export const BACKUP_TASKS: BackupTask[] = [
  membersTask,
  settingsTask,
  senderIdsTask,
  emailTemplatesTask,
  emailCampaignsTask,
  emailSubscribersTask,
  messagesTask,
  numbersTask,
];

export function tasksForCategories(categories: BackupCategoryId[]): BackupTask[] {
  return BACKUP_TASKS.filter((t) => categories.includes(TASK_CATEGORY[t.id]));
}
