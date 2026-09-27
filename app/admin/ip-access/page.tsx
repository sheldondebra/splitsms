import { Suspense } from "react";
import { AdminIpAccessView } from "@/components/admin/admin-ip-access-view";
import { IpAccessToasts } from "@/components/admin/ip-access-toasts";
import {
  getRecentBlockedIpLogins,
  loadPlatformIpAccessConfig,
} from "@/lib/admin/ip-access";
import { getRequestIp } from "@/lib/auth/request-ip";

export default async function AdminIpAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string; q?: string; check?: string }>;
}) {
  const params = await searchParams;
  const list = params.list === "whitelist" ? "whitelist" : "blacklist";
  const query = params.q?.trim() ?? "";
  const checkIp = params.check?.trim() ?? "";
  const [config, currentIp, blockedLogins] = await Promise.all([
    loadPlatformIpAccessConfig(),
    getRequestIp(),
    getRecentBlockedIpLogins(20),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <IpAccessToasts />
      </Suspense>
      <AdminIpAccessView
        config={config}
        currentIp={currentIp}
        blockedLogins={blockedLogins}
        list={list}
        query={query}
        checkIp={checkIp}
      />
    </>
  );
}
