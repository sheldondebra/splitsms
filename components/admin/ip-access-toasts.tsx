"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SAVED: Record<string, string> = {
  ip_blocked: "IP added to the blacklist.",
  ip_unblocked: "IP removed from the blacklist.",
  ip_whitelisted: "IP added to the whitelist.",
  ip_whitelist_removed: "IP removed from the whitelist.",
  whitelist_enabled: "Whitelist mode is on — only listed IPs can sign in.",
  whitelist_disabled: "Whitelist mode is off — blacklist still applies.",
  ip_bulk_blocked: "IPs added to the blacklist.",
  ip_bulk_whitelisted: "IPs added to the whitelist.",
};

const ERRORS: Record<string, string> = {
  invalid_ip: "Enter a valid IP address or prefix (e.g. 203.0.113.10 or 203.0.113.).",
  notfound: "That IP was not on the list.",
  empty_bulk: "Paste at least one IP address (one per line).",
};

export function IpAccessToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");
    const key = saved ? `s:${saved}` : error ? `e:${error}` : null;
    if (!key || shown.current === key) return;
    shown.current = key;

    if (saved) {
      const count = searchParams.get("count");
      const base = SAVED[saved] ?? "Changes saved.";
      toast.success("IP access updated", {
        description:
          count && (saved === "ip_bulk_blocked" || saved === "ip_bulk_whitelisted")
            ? `${count} IP${count === "1" ? "" : "s"} updated. ${base}`
            : base,
      });
    } else if (error) {
      toast.error("Could not update IP", {
        description: ERRORS[error] ?? error.replace(/_/g, " "),
      });
    }

    if (saved || error) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      params.delete("error");
      params.delete("count");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return null;
}
