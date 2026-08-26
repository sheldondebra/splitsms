import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { GOOGLE_BASE_SCOPES } from "@/lib/google/scopes";
import { mergeScopes, parseScopeString } from "@/lib/google/connection-utils";
import {
  applyConnectPkceCookie,
  buildGoogleConnectAuthorizeUrl,
  createPkcePair,
  getGoogleClientCredentials,
  googleConnectCallbackUri,
  googleConnectResultUrl,
  resolveGoogleOAuthOrigin,
  safeConnectReturnTo,
  signConnectState,
} from "@/lib/google/oauth-connect";

export async function GET(request: NextRequest) {
  const origin = resolveGoogleOAuthOrigin(request);
  const returnTo = safeConnectReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const session = await getSession();
  if (!session) {
    const login = new URL("/login", origin);
    login.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(login);
  }

  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return NextResponse.redirect(
      googleConnectResultUrl(origin, returnTo, { error: "google_config" }),
    );
  }

  const extraScopes = parseScopeString(request.nextUrl.searchParams.get("scopes"));
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

  const url = buildGoogleConnectAuthorizeUrl({
    state,
    codeChallenge: challenge,
    clientId: credentials.clientId,
    redirectUri: googleConnectCallbackUri(origin),
    scopes: requestedScopes,
    forceConsent,
  });

  const response = NextResponse.redirect(url);
  applyConnectPkceCookie(response, verifier);
  return response;
}
