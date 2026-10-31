import { NextResponse } from "next/server";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import {
  getOutdatedWordPressSiteOwners,
  notifyOutdatedWordPressSiteOwners,
} from "@/lib/wordpress/admin";

export async function GET() {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owners = await getOutdatedWordPressSiteOwners();
  return NextResponse.json({
    success: true,
    ownerCount: owners.length,
    siteCount: owners.reduce((sum, o) => sum + o.sites.length, 0),
    missingEmailCount: owners.filter((o) => !o.email).length,
  });
}

export async function POST() {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await notifyOutdatedWordPressSiteOwners();
  return NextResponse.json({ success: true, ...result });
}
