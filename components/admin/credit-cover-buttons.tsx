"use client";

import { useFormStatus } from "react-dom";
import { Loader2, BellRing, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaveCreditCoverThresholdButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-9 gap-1.5" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function SendCreditCoverAlertButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-9 gap-1.5 bg-red-600 px-3 text-white hover:bg-red-700 focus-visible:border-red-700 focus-visible:ring-red-600/40"
      disabled={pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
      {pending ? "Sending…" : "Alert admins"}
    </Button>
  );
}
