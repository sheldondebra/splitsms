import { headers } from "next/headers";
import { FeatureUnavailable } from "@/components/platform/feature-unavailable";
import {
  featureForPath,
  isFeatureEnabledIn,
  loadPlatformFeatureFlags,
} from "@/lib/platform/features";

export default async function DevelopersTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-splitsms-pathname") ?? "";
  const feature = featureForPath(pathname);
  if (!feature) return children;

  const flags = await loadPlatformFeatureFlags();
  if (isFeatureEnabledIn(flags, feature)) return children;

  return <FeatureUnavailable feature={feature} />;
}
