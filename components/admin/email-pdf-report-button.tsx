"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailPdfReportButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full gap-1.5" disabled={disabled || pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
      {pending ? "Sending PDF report…" : "Email PDF report"}
    </Button>
  );
}
