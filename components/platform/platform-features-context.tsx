"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  defaultPlatformFeatureFlags,
  isFeatureEnabledIn,
  type PlatformFeatureFlags,
  type PlatformFeatureId,
} from "@/lib/platform/feature-catalog";
import {
  dashboardNavSections,
  filterDashboardNavSections,
  type DashboardNavSection,
} from "@/lib/navigation/dashboard-nav";

const PlatformFeaturesContext = createContext<PlatformFeatureFlags | null>(null);

export function PlatformFeaturesProvider({
  flags,
  children,
}: {
  flags: PlatformFeatureFlags;
  children: ReactNode;
}) {
  return (
    <PlatformFeaturesContext.Provider value={flags}>
      {children}
    </PlatformFeaturesContext.Provider>
  );
}

export function usePlatformFeatures(): PlatformFeatureFlags {
  return useContext(PlatformFeaturesContext) ?? defaultPlatformFeatureFlags();
}

export function useFeatureEnabled(id: PlatformFeatureId) {
  const flags = usePlatformFeatures();
  return isFeatureEnabledIn(flags, id);
}

export function useDashboardNavByFeatures(): DashboardNavSection[] {
  const flags = usePlatformFeatures();
  return useMemo(
    () => filterDashboardNavSections(dashboardNavSections, flags),
    [flags],
  );
}
