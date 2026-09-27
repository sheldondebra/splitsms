import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getRequestIp } from "@/lib/auth/request-ip";

export async function recordDeviceSession(userId: string) {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? undefined;
  const ip = await getRequestIp();

  await prisma.userSession.create({
    data: {
      userId,
      userAgent,
      ip: ip === "unknown" ? undefined : ip,
    },
  });
}
