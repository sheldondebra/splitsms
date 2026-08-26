"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function MembersListToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    if (saved !== "member_deleted") return;
    const key = `s:${saved}`;
    if (shown.current === key) return;
    shown.current = key;

    toast.success("Member deleted", {
      description: "The suspended account was permanently removed.",
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("saved");
    const qs = params.toString();
    router.replace(qs ? `/admin/members?${qs}` : "/admin/members", { scroll: false });
  }, [router, searchParams]);

  return null;
}
