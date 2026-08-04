import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  identityFromAccessToken,
  upsertGoogleConnectionFromOAuth,
} from "@/lib/google/connection";
import { resolveGrantedScopes } from "@/lib/google/connection-utils";
import { prisma } from "@/lib/db";
import {
  consumeConnectPkceCookie,
  exchangeGoogleConnectCode,
  getGoogleClientCredentials,
  googleConnectCallbackUri,
  resolveGoogleOAuthOrigin,
  verifyConnectState,
} from "@/lib/google/oauth-connect";

function redirectError(origin: string, code: string) {
  return NextResponse.redirect(
    new URL(`/dashboard/integrations/google?error=${code}`, origin),
  );
}

function safeReturnTo(raw: string | undefined): string {
  if (!raw) return "/dashboard/integrations/google";
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard/integrations/google";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const origin = resolveGoogleOAuthOrigin(request);
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return redirectError(origin, "google_config");
  }

  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam === "access_denied") {
    return redirectError(origin, "google_denied");
  }
  if (errorParam) {
    return redirectError(origin, "google_failed");
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateToken = request.nextUrl.searchParams.get("state");
  if (!code || !stateToken) {
    return redirectError(origin, "google_failed");
  }

  const state = await verifyConnectState(stateToken);
  if (!state || state.userId !== session.userId) {
    return redirectError(origin, "google_session");
  }

  const codeVerifier = await consumeConnectPkceCookie();
  if (!codeVerifier) {
    return redirectError(origin, "google_failed");
  }

  const redirectUri = googleConnectCallbackUri(origin);
  const tokenResult = await exchangeGoogleConnectCode({
    code,
    codeVerifier,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });

  if ("error" in tokenResult) {
    return redirectError(origin, "google_failed");
  }

  const identity = await identityFromAccessToken(tokenResult.accessToken);
  if (!identity) {
    return redirectError(origin, "google_failed");
  }

  const existing = await prisma.googleConnection.findUnique({
    where: { userId: session.userId },
    select: { scopes: true },
  });

  const grantedScopes = resolveGrantedScopes(
    tokenResult.scope,
    state.requestedScopes,
    existing?.scopes ?? [],
  );

  try {
    await upsertGoogleConnectionFromOAuth({
      userId: session.userId,
      googleSubject: identity.googleId,
      email: identity.email,
      refreshToken: tokenResult.refreshToken,
      accessToken: tokenResult.accessToken,
      expiresIn: tokenResult.expiresIn,
      grantedScopes,
    });
  } catch {
    // Incremental re-auth sometimes omits refresh_token; require consent retry.
    return redirectError(origin, "google_reconnect");
  }

  const dest = new URL(safeReturnTo(state.returnTo), origin);
  dest.searchParams.set("connected", "1");
  return NextResponse.redirect(dest);
}
