"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SAVED_MESSAGES: Record<string, string> = {
  created: "Staff user created successfully.",
  updated: "Staff user updated.",
  demoted: "Staff access removed.",
};

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "You do not have permission to manage staff.",
  duplicate: "A user with this phone already exists.",
  duplicate_email: "That email is already in use.",
  notfound: "Staff user not found.",
  self: "You cannot perform this action on your own account.",
  name: "Enter a valid full name.",
  phone: "Enter a valid phone number.",
  password: "Password must be at least 8 characters.",
  role: "Invalid staff role selected.",
};

export function StaffAdminToasts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");
    const key = saved ? `s:${saved}` : error ? `e:${error}` : null;
    if (!key || shown.current === key) return;
    shown.current = key;

    if (saved && SAVED_MESSAGES[saved]) {
      toast.success("Done", { description: SAVED_MESSAGES[saved] });
    } else if (error) {
      toast.error("Action failed", {
        description: ERROR_MESSAGES[error] ?? `Could not complete action (${error}).`,
      });
    }

    if (saved || error) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      params.delete("error");
      const qs = params.toString();
      router.replace(qs ? `/admin/staff?${qs}` : "/admin/staff", { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
