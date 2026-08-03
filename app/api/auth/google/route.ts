import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildGoogleAuthorizeUrl,
  createPkcePair,
  getGoogleClientCredentials,
  googleCallbackUri,
  resolveGoogleOAuthOrigin,
  setPkceVerifierCookie,
  signOAuthState,
} from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  const origin = resolveGoogleOAuthOrigin(request);
  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return NextResponse.redirect(new URL("/login?error=google_config", origin));
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo")?.trim() || undefined;
  const resellerInvite = request.nextUrl.searchParams.get("r")?.trim() || undefined;
  const safeReturn =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : undefined;

  const { verifier, challenge } = createPkcePair();
  const state = await signOAuthState({
    nonce: randomBytes(16).toString("base64url"),
    returnTo: safeReturn,
    resellerInvite,
  });

  await setPkceVerifierCookie(verifier);

  const redirectUri = googleCallbackUri(origin);
  const url = buildGoogleAuthorizeUrl({
    state,
    codeChallenge: challenge,
    clientId: credentials.clientId,
    redirectUri,
  });

  return NextResponse.redirect(url);
}
