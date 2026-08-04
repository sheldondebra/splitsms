"use client";

import { useTransition } from "react";
import { exportContactsToGoogleAction } from "@/lib/actions/google-contacts";
import { GOOGLE_CONTACTS_EXPORT_SCOPES } from "@/lib/google/scopes";
import { googleConnectHref } from "@/lib/google/connect-url";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";

export function GoogleContactsExportPanel({
  connected,
  totalContacts,
}: {
  connected: boolean;
  totalContacts: number;
}) {
  const [pending, startTransition] = useTransition();
  const connectHref = googleConnectHref({
    scopes: [...GOOGLE_CONTACTS_EXPORT_SCOPES],
    returnTo: "/dashboard/contacts",
  });

  function exportAll() {
    const fd = new FormData();
    fd.set("mode", "all");
    startTransition(() => exportContactsToGoogleAction(fd));
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          Export to Google Contacts
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Push SplitSMS contacts (up to 2,000) into your Google Contacts.
        </p>
      </div>
      {!connected ? (
        <a href={connectHref} className={cn(buttonVariants({ size: "sm" }))}>
          Connect Google
        </a>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={exportAll}
          disabled={pending || totalContacts === 0}
          className="gap-2"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Export all contacts ({totalContacts})
        </Button>
      )}
    </div>
  );
}
