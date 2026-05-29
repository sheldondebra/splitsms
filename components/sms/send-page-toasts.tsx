"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { friendlyError } from "@/lib/ux/messages";

/** Show toast once when landing on Send SMS with ?error= or ?sent= in the URL. */
export function SendPageToasts() {
  const searchParams = useSearchParams();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const sent = searchParams.get("sent");

    const key = error ? `e:${error}` : sent ? `s:${sent}` : null;
    if (!key || shown.current === key) return;
    shown.current = key;

    if (error) {
      toast.error("Could not send", {
        description: friendlyError(error),
      });
      return;
    }

    if (sent) {
      toast.success("Messages sent!", {
        description: "Your messages were queued successfully.",
      });
    }
  }, [searchParams]);

  return null;
}
