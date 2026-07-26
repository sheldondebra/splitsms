"use client";

import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { adminSystemSyncAction } from "@/lib/actions/admin-operations";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant="outline"
      className="hidden lg:inline-flex h-9 gap-1.5"
      disabled={pending}
      title="Run full system sync"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      {pending ? "Syncing..." : "System sync"}
    </Button>
  );
}

export function AdminSystemSyncButton() {
  const pathname = usePathname();

  return (
    <form action={adminSystemSyncAction}>
      <input type="hidden" name="returnTo" value={pathname || "/admin"} />
      <SubmitButton />
    </form>
  );
}
