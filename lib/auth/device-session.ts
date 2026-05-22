import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function recordDeviceSession(userId: string) {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? undefined;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined;

  await prisma.userSession.create({
    data: { userId, userAgent, ip },
  });
}
