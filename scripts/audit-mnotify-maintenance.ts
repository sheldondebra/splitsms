/** Read-only audit. Requires an explicitly confirmed window, with timezone offsets. */
import "dotenv/config";
import { prisma } from "@/lib/db";
import { getMnotifyStatus } from "@/lib/mnotify";
import { loadSmsRoutingPolicy } from "@/lib/sms/routing-policy";
import { getProviderOrderForCountry } from "@/lib/sms/country-provider";
import { mnotifyMaintenanceHold } from "@/lib/sms/maintenance";

async function main() {
  const [startRaw, endRaw] = process.argv.slice(2);
  const windowEnv = { MNOTIFY_MAINTENANCE_START: startRaw, MNOTIFY_MAINTENANCE_END: endRaw };
  const validation = mnotifyMaintenanceHold(Date.parse(startRaw ?? ""), windowEnv);
  if (!startRaw || !endRaw || validation.reason?.startsWith("Invalid")) {
    throw new Error("Usage: npx tsx scripts/audit-mnotify-maintenance.ts <confirmed-start-with-offset> <confirmed-end-with-offset>");
  }
  const start = new Date(startRaw), end = new Date(endRaw);
  const [mnotify, policy, providers, routes, members, enterprise, campaigns, backlog] = await Promise.all([
    getMnotifyStatus(),
    loadSmsRoutingPolicy(),
    prisma.smsProvider.findMany({ select: { type: true, isActive: true } }),
    prisma.smsRoute.findMany({ select: { id: true, isActive: true, country: { select: { code: true } }, steps: { select: { priority: true, provider: { select: { type: true, isActive: true } } }, orderBy: { priority: "asc" } } } }),
    prisma.memberAccount.groupBy({ by: ["assignedProvider"], _count: true }),
    prisma.enterpriseAccount.findMany({ select: { id: true, dedicatedRoute: { select: { countryCode: true, lockedProvider: true } } } }),
    // Includes overdue scheduled work that could still be queued when the window starts.
    prisma.campaign.findMany({ where: { status: { in: ["SCHEDULED", "SENDING", "PAUSED"] }, OR: [{ scheduledAt: { lt: end } }, { scheduledAt: null }] }, select: { id: true, status: true, countryCode: true, scheduledAt: true, timezone: true, recipientCount: true, recurrence: true, _count: { select: { messages: true } } }, orderBy: { scheduledAt: "asc" } }),
    prisma.message.groupBy({ by: ["status", "providerType"], where: { status: { in: ["PENDING", "PROCESSING", "SENT"] }, isSandbox: false }, _count: true }),
  ]);
  const countries = [...new Set(["GH", "GLOBAL", ...campaigns.map(c => c.countryCode)])];
  const effectiveOrders = Object.fromEntries(await Promise.all(countries.map(async c => [c, await getProviderOrderForCountry(c)])));
  console.log(JSON.stringify({
    auditedAt: new Date().toISOString(), confirmedWindow: { start, end }, mnotify: { configured: mnotify.configured, enabled: mnotify.enabled, source: mnotify.source, firstProvider: mnotify.firstProvider, allowFailover: mnotify.allowFailover }, policy, providers, routes,
    memberProviderAssignments: members, enterpriseLockedRoutes: enterprise.filter(e => e.dedicatedRoute?.lockedProvider),
    effectiveOrders, candidateCampaigns: campaigns, backlog,
    limitations: ["Candidates require recipient-country and per-user lock review; not all candidates use mNotify.", "Future recurring runs not yet created and traffic arriving after this audit are not included.", "No messages were sent and no configuration, campaigns, or balances were changed."],
  }, null, 2));
}
main().catch(() => { console.error("Read-only audit could not complete. Check explicit offset timestamps, database access and schema locally; no secrets are printed."); process.exitCode = 1; });
