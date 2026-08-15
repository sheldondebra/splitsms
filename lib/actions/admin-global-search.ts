"use server";

import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { adminGlobalSearch, type AdminSearchHit } from "@/lib/admin/global-search";

export async function adminGlobalSearchAction(
  query: string,
): Promise<{ ok: true; hits: AdminSearchHit[] } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const q = query.trim();
  if (q.length < 2) {
    return { ok: true, hits: [] };
  }

  try {
    const hits = await adminGlobalSearch(q);
    return { ok: true, hits };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Search failed",
    };
  }
}
