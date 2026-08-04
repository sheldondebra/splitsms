import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAccessTokenForUser } from "@/lib/google/connection";
import { googleConnectHref } from "@/lib/google/connect-url";
import { listGoogleForms, getGoogleFormQuestions } from "@/lib/google/forms";
import { GOOGLE_FORMS_SCOPES } from "@/lib/google/scopes";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formId = request.nextUrl.searchParams.get("formId")?.trim();
  const token = await getAccessTokenForUser(session.userId, [...GOOGLE_FORMS_SCOPES]);
  if (!token.ok) {
    return NextResponse.json(
      {
        error: token.code,
        connectUrl: googleConnectHref({
          scopes: token.missingScopes?.length
            ? token.missingScopes
            : [...GOOGLE_FORMS_SCOPES],
          returnTo: "/dashboard/integrations/google/forms",
          force: token.code === "reconnect",
        }),
      },
      { status: 403 },
    );
  }

  try {
    if (formId) {
      const detail = await getGoogleFormQuestions(token.accessToken, formId);
      return NextResponse.json(detail);
    }
    const forms = await listGoogleForms(token.accessToken);
    return NextResponse.json({ forms });
  } catch {
    return NextResponse.json({ error: "forms_list_failed" }, { status: 502 });
  }
}
