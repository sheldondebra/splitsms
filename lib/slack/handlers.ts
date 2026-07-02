import {
  approveSenderIdCore,
  rejectSenderIdCore,
} from "@/lib/actions/admin-sender-ids";
import { approveManualPayment, rejectManualPayment } from "@/lib/payments/wallet";
import { updateSupportTicketStatus } from "@/lib/support/staff-actions";
import type { SlackQuickAction } from "@/lib/slack/quick-actions";
import { revalidatePath } from "next/cache";

export type SlackQuickActionResult =
  | { ok: true; message: string; redirect: string }
  | { ok: false; error: string; redirect: string };

export async function executeSlackQuickAction(
  action: SlackQuickAction,
  id: string,
  adminId: string,
): Promise<SlackQuickActionResult> {
  if (action === "sender_approve") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("setDefault", "1");
    fd.set("purpose", "Approved via Slack");
    const result = await approveSenderIdCore(fd, { actorId: adminId });
    revalidatePath("/admin/sender-ids");
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        redirect: `/admin/sender-ids?tab=pending&error=${result.error}`,
      };
    }
    return {
      ok: true,
      message: "Sender ID approved",
      redirect: "/admin/sender-ids?tab=pending&saved=approved&from=slack",
    };
  }

  if (action === "sender_deny") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("note", "Denied via Slack");
    fd.set("addToBanList", "off");
    const result = await rejectSenderIdCore(fd, { actorId: adminId });
    revalidatePath("/admin/sender-ids");
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        redirect: `/admin/sender-ids?tab=pending&error=${result.error}`,
      };
    }
    return {
      ok: true,
      message: "Sender ID denied",
      redirect: "/admin/sender-ids?tab=pending&saved=rejected&from=slack",
    };
  }

  if (action === "sender_ban") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("note", "Banned via Slack");
    fd.set("addToBanList", "on");
    const result = await rejectSenderIdCore(fd, { actorId: adminId, ban: true });
    revalidatePath("/admin/sender-ids");
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        redirect: `/admin/sender-ids?tab=pending&error=${result.error}`,
      };
    }
    return {
      ok: true,
      message: "Sender ID banned",
      redirect: "/admin/sender-ids?tab=pending&saved=blocked&from=slack",
    };
  }

  if (action === "payment_credit") {
    try {
      await approveManualPayment(id, adminId);
      revalidatePath("/admin/payments");
      return {
        ok: true,
        message: "Wallet credited",
        redirect: "/admin/payments?saved=approved&from=slack",
      };
    } catch {
      return { ok: false, error: "payment_invalid", redirect: "/admin/payments?error=payment" };
    }
  }

  if (action === "payment_deny") {
    try {
      await rejectManualPayment(id, adminId, "Denied via Slack");
      revalidatePath("/admin/payments");
      return {
        ok: true,
        message: "Payment denied",
        redirect: "/admin/payments?saved=rejected&from=slack",
      };
    } catch {
      return { ok: false, error: "payment_invalid", redirect: "/admin/payments?error=payment" };
    }
  }

  if (
    action === "ticket_in_progress" ||
    action === "ticket_resolved" ||
    action === "ticket_closed"
  ) {
    const status =
      action === "ticket_in_progress"
        ? "IN_PROGRESS"
        : action === "ticket_resolved"
          ? "RESOLVED"
          : "CLOSED";
    const result = await updateSupportTicketStatus({
      ticketId: id,
      adminId,
      status,
      source: "slack",
    });
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        redirect: `/admin/support?error=ticket`,
      };
    }
    return {
      ok: true,
      message: `Ticket marked ${status.replace("_", " ").toLowerCase()}`,
      redirect: `/admin/support?saved=ticket&from=slack`,
    };
  }

  return { ok: false, error: "unknown_action", redirect: "/admin?error=slack_action" };
}
