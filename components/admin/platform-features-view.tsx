"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  setPlatformFeatureGroupAction,
  togglePlatformFeatureAction,
} from "@/lib/actions/admin-features";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  PLATFORM_FEATURE_GROUPS,
  isFeatureEnabledIn,
  platformFeatureLabel,
  platformFeatureRequires,
  type PlatformFeatureFlags,
  type PlatformFeatureId,
} from "@/lib/platform/feature-catalog";

export function PlatformFeaturesView({
  flags,
  canWrite,
}: {
  flags: PlatformFeatureFlags;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState(flags);

  function setFlag(id: PlatformFeatureId, enabled: boolean) {
    setLocal((prev) => ({ ...prev, [id]: enabled }));
    startTransition(async () => {
      const result = await togglePlatformFeatureAction({ id, enabled });
      if (result.ok) toast.success(result.message);
      else {
        toast.error(result.message);
        setLocal(flags);
      }
      router.refresh();
    });
  }

  function setGroup(ids: PlatformFeatureId[], enabled: boolean) {
    setLocal((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = enabled;
      return next;
    });
    startTransition(async () => {
      const result = await setPlatformFeatureGroupAction({ ids, enabled });
      if (result.ok) toast.success(result.message);
      else {
        toast.error(result.message);
        setLocal(flags);
      }
      router.refresh();
    });
  }

  const enabledCount = Object.values(local).filter(Boolean).length;
  const total = Object.keys(local).length;

  return (
    <div className="space-y-6">
      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Platform features</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabledCount} of {total} switches on. Staff keep admin access when member login is off.
            </p>
          </div>
          {canWrite ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setGroup(Object.keys(local) as PlatformFeatureId[], true)}
              >
                Enable all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setGroup(Object.keys(local) as PlatformFeatureId[], false)}
              >
                Disable all
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">You can view switches but not change them.</p>
          )}
        </div>
      </AdminCard>

      {PLATFORM_FEATURE_GROUPS.map((group) => {
        const ids = group.features.map((f) => f.id);
        return (
          <AdminCard
            key={group.id}
            title={group.label}
            description={group.description}
            actions={
              canWrite ? (
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setGroup(ids, true)}
                  >
                    All on
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setGroup(ids, false)}
                  >
                    All off
                  </Button>
                </div>
              ) : null
            }
          >
            <ul className="divide-y divide-border/50">
              {group.features.map((feature) => {
                const selfOn = local[feature.id] !== false;
                const effective = isFeatureEnabledIn(local, feature.id);
                const blockedByParent = selfOn && !effective;
                const parentId = platformFeatureRequires(feature.id)[0];
                return (
                  <li
                    key={feature.id}
                    className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{feature.label}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            effective
                              ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                              : "border-border/60 text-muted-foreground",
                          )}
                        >
                          {effective ? "On" : "Off"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{feature.description}</p>
                      {blockedByParent && parentId ? (
                        <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-200">
                          Blocked because {platformFeatureLabel(parentId)} is off.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {selfOn ? "On" : "Off"}
                      </span>
                      <Switch
                        checked={selfOn}
                        disabled={!canWrite || pending}
                        onCheckedChange={(next) => setFlag(feature.id, next)}
                        aria-label={`Toggle ${feature.label}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </AdminCard>
        );
      })}
    </div>
  );
}
