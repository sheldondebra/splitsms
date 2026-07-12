import { prisma } from "@/lib/db";
import { loadGeneralOfficeConfig } from "@/lib/general-office/config";

export type AdminAlertRecipient = { email?: string; phone?: string; name?: string };

/** Emails and phones configured under Admin → General → Office alerts. */
export async function resolveAdminAlertRecipients(): Promise<AdminAlertRecipient[]> {
  const config = await loadGeneralOfficeConfig();
  const recipients: AdminAlertRecipient[] = [];

  for (const email of config.notifyEmails) {
    recipients.push({ email });
  }
  for (const phone of config.notifyPhones) {
    recipients.push({ phone });
  }

  if (config.notifyAdminUsers) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { email: true, phone: true, fullName: true },
    });
    for (const admin of admins) {
      recipients.push({
        email: admin.email ?? undefined,
        phone: admin.phone,
        name: admin.fullName,
      });
    }
  }

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  return recipients.filter((r) => {
    if (r.email) {
      const key = r.email.toLowerCase();
      if (seenEmails.has(key)) return false;
      seenEmails.add(key);
    }
    if (r.phone) {
      if (seenPhones.has(r.phone)) return false;
      seenPhones.add(r.phone);
    }
    return Boolean(r.email || r.phone);
  });
}
