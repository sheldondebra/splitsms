import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { GOOGLE_BASE_SCOPES } from "@/lib/google/scopes";
import { mergeScopes, parseScopeString } from "@/lib/google/connection-utils";
import {
  buildGoogleConnectAuthorizeUrl,
  createPkcePair,
  getGoogleClientCredentials,
  googleConnectCallbackUri,
  resolveGoogleOAuthOrigin,
  setConnectPkceCookie,
  signConnectState,
} from "@/lib/google/oauth-connect";

function safeReturnTo(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  return trimmed;
}

export async function GET(request: NextRequest) {
  const origin = resolveGoogleOAuthOrigin(request);
  const session = await getSession();
  if (!session) {
    const login = new URL("/login", origin);
    login.searchParams.set("returnTo", "/dashboard/integrations/google");
    return NextResponse.redirect(login);
  }

  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations/google?error=google_config", origin),
    );
  }

  const returnTo =
    safeReturnTo(request.nextUrl.searchParams.get("returnTo")) ??
    "/dashboard/integrations/google";
  const extraScopes = parseScopeString(
    request.nextUrl.searchParams.get("scopes"),
  );
  const requestedScopes = mergeScopes([...GOOGLE_BASE_SCOPES], extraScopes);

  const existing = await prisma.googleConnection.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  const forceConsent =
    request.nextUrl.searchParams.get("force") === "1" || !existing;
  const { verifier, challenge } = createPkcePair();
  const state = await signConnectState({
    userId: session.userId,
    returnTo,
    requestedScopes,
    nonce: randomBytes(16).toString("base64url"),
  });

  await setConnectPkceCookie(verifier);

  const url = buildGoogleConnectAuthorizeUrl({
    state,
    codeChallenge: challenge,
    clientId: credentials.clientId,
    redirectUri: googleConnectCallbackUri(origin),
    scopes: requestedScopes,
    // First connect / forced reconnect must obtain a refresh token.
    forceConsent,
  });

  return NextResponse.redirect(url);
}
