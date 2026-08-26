"use client";

import { useState } from "react";
import { saveGa4ConfigAction } from "@/lib/actions/admin-ga4";
import type { Ga4Config } from "@/lib/analytics/ga4-config";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Ga4SettingsForm({
  config,
  serviceAccountEmail,
  serviceAccountConfigured,
}: {
  config: Ga4Config;
  serviceAccountEmail: string;
  serviceAccountConfigured: boolean;
}) {
  const [enabled, setEnabled] = useState(config.enabled);

  return (
    <AdminCard
      title="Connect Google Analytics"
      description="One GA4 property powers both the tracking snippet on the site and the reports below."
    >
      <ol className="mb-5 space-y-2 text-sm text-muted-foreground">
        <li>
          1. In Google Analytics, create (or open) a GA4 property for the site and copy its{" "}
          <strong className="text-foreground">Measurement ID</strong> (starts with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">G-</code>) and{" "}
          <strong className="text-foreground">Property ID</strong> (a plain number, from Admin →
          Property details).
        </li>
        <li>
          2. In that property, go to{" "}
          <strong className="text-foreground">Admin → Property access management</strong> and add
          this account as a <strong className="text-foreground">Viewer</strong>:
          <code className="ml-1 block w-fit rounded bg-muted px-2 py-1 text-xs">
            {serviceAccountEmail || "not configured on the server yet"}
          </code>
        </li>
        <li>3. Paste both IDs below and save.</li>
      </ol>

      {!serviceAccountConfigured ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          The server isn&apos;t configured with a GA4 service account yet (GOOGLE_GA_SA_CLIENT_EMAIL /
          GOOGLE_GA_SA_PRIVATE_KEY). Reports won&apos;t load until that&apos;s set.
        </p>
      ) : null}

      <form action={saveGa4ConfigAction} className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-background px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-5">Enable Google Analytics</p>
            <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
              Turns on the site tracking snippet and this traffic dashboard.
            </p>
          </div>
          <Checkbox
            name="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.currentTarget.checked)}
            className="mt-0.5"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="measurementId">Measurement ID</Label>
            <Input
              id="measurementId"
              name="measurementId"
              defaultValue={config.measurementId}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="propertyId">Property ID</Label>
            <Input
              id="propertyId"
              name="propertyId"
              defaultValue={config.propertyId}
              placeholder="123456789"
            />
          </div>
        </div>

        <Button type="submit">Save</Button>
      </form>
    </AdminCard>
  );
}
