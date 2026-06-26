"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function AuthSubmitButton({ label, pendingLabel, className }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={cn("w-full h-11 font-semibold text-base gap-2", className)}
      disabled={pending}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? (pendingLabel ?? label) : label}
    </Button>
  );
}
