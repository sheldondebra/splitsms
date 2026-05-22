import { prisma } from "@/lib/db";

export async function logApiRequest(params: {
  userId?: string;
  apiKeyId?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  requestBytes?: number;
  errorCode?: string;
}) {
  try {
    await prisma.apiLog.create({ data: params });
  } catch {
    /* non-blocking */
  }
}
