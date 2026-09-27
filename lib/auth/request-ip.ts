import { headers } from "next/headers";
import { pickClientIpFromHeaders } from "@/lib/auth/client-ip";

export { normalizeClientIp, pickClientIpFromHeaders } from "@/lib/auth/client-ip";

export async function getRequestIp(): Promise<string> {
  const h = await headers();
  return pickClientIpFromHeaders((name) => h.get(name));
}

/** Same extraction for Route Handlers that already have a Request. */
export function getClientIpFromRequest(request: Request): string {
  return pickClientIpFromHeaders((name) => request.headers.get(name));
}
