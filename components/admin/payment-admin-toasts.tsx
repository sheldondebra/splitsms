"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SAVED_MESSAGES: Record<string, string> = {
  rejected: "Payment rejected — member was not credited.",
  credited: "Stripe payment verified and wallet credited.",
  approved: "Offline payment approved and wallet credited.",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_paid: "Stripe does not show this payment as paid yet. The customer may still be in checkout.",
  receipt: "Could not send receipt.",
  payment: "Payment not found or already processed.",
};

export function PaymentAdminToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");
    const synced = searchParams.get("synced");
    const receipt = searchParams.get("receipt");
    const channel = searchParams.get("channel");
    const msg = searchParams.get("msg");
    const fromSlack = searchParams.get("from") === "slack";

    const key = saved
      ? `s:${saved}`
      : error
        ? `e:${error}`
        : synced
          ? `sync:${synced}`
          : receipt
            ? `r:${receipt}`
            : null;

    if (!key || shown.current === key) return;
    shown.current = key;

    if (saved && SAVED_MESSAGES[saved]) {
      toast.success(fromSlack ? "Action completed from Slack" : "Done", {
        description: SAVED_MESSAGES[saved],
      });
    } else if (error) {
      const detail =
        error === "receipt" && msg
          ? decodeURIComponent(msg)
          : ERROR_MESSAGES[error] ?? `Could not complete action (${error}).`;
      toast.error("Action failed", { description: detail });
    } else if (synced && Number(synced) > 0) {
      const count = Number(synced);
      toast.success("Online payments synced", {
        description: `${count} paid checkout${count === 1 ? "" : "s"} auto-credited to member wallets.`,
      });
    } else if (receipt === "sent") {
      toast.success("Receipt sent", {
        description:
          channel === "both" ? "Sent by email and SMS." : `Sent via ${channel ?? "email and SMS"}.`,
      });
    }

    if (saved || error || synced || receipt) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      params.delete("error");
      params.delete("synced");
      params.delete("checked");
      params.delete("receipt");
      params.delete("channel");
      params.delete("msg");
      params.delete("from");
      const qs = params.toString();
      router.replace(qs ? `/admin/payments?${qs}` : "/admin/payments", { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
