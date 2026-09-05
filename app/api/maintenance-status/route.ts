import { NextResponse } from "next/server";
import { isMaintenanceActive } from "@/lib/admin/maintenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = await isMaintenanceActive();
  return NextResponse.json({ enabled });
}
