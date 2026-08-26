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
  googleConnectResultUrl,
  resolveGoogleOAuthOrigin,
  verifyConnectState,
} from "@/lib/google/oauth-connect";

function redirectConnect(
  origin: string,
  returnTo: string | undefined,
  params: { error?: string; connected?: boolean },
) {
  return NextResponse.redirect(googleConnectResultUrl(origin, returnTo, params));
}

/** Finish Integrations OAuth. Shared by Sign-In callback (registered URI) and the legacy connect callback. */
export async function handleGoogleConnectCallback(request: NextRequest) {
  const origin = resolveGoogleOAuthOrigin(request);
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const stateToken = request.nextUrl.searchParams.get("state");
  const state = stateToken ? await verifyConnectState(stateToken) : null;
  const returnTo = state?.returnTo;

  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return redirectConnect(origin, returnTo, { error: "google_config" });
  }

  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam === "access_denied") {
    return redirectConnect(origin, returnTo, { error: "google_denied" });
  }
  if (errorParam) {
    return redirectConnect(origin, returnTo, { error: "google_failed" });
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code || !stateToken) {
    return redirectConnect(origin, returnTo, { error: "google_failed" });
  }

  if (!state || state.userId !== session.userId) {
    return redirectConnect(origin, returnTo, { error: "google_session" });
  }

  const codeVerifier = await consumeConnectPkceCookie();
  if (!codeVerifier) {
    return redirectConnect(origin, returnTo, { error: "google_failed" });
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
    return redirectConnect(origin, returnTo, { error: "google_failed" });
  }

  const identity = await identityFromAccessToken(tokenResult.accessToken);
  if (!identity) {
    return redirectConnect(origin, returnTo, { error: "google_failed" });
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
    return redirectConnect(origin, returnTo, { error: "google_reconnect" });
  }

  return redirectConnect(origin, returnTo, { connected: true });
}
