import type { NextRequest } from "next/server";
import { handleGoogleConnectCallback } from "@/lib/google/complete-connect";

export async function GET(request: NextRequest) {
  return handleGoogleConnectCallback(request);
}
