import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  consumePkceVerifierCookie,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleClientCredentials,
  googleCallbackUri,
  resolveGoogleOAuthOrigin,
  setGooglePendingCookie,
  verifyOAuthState,
} from "@/lib/auth/google";
import {
  establishGoogleSession,
  resolveGoogleSignIn,
} from "@/lib/auth/google-login";
import { logAuthEvent } from "@/lib/auth/audit";
import { createAndSendOtp } from "@/lib/auth/otp";
import { handleGoogleConnectCallback } from "@/lib/google/complete-connect";
import { verifyConnectState } from "@/lib/google/oauth-connect";

function loginError(origin: string, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
}

export async function GET(request: NextRequest) {
  const origin = resolveGoogleOAuthOrigin(request);
  const stateToken = request.nextUrl.searchParams.get("state");
  if (stateToken && (await verifyConnectState(stateToken))) {
    return handleGoogleConnectCallback(request);
  }

  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return loginError(origin, "google_config");
  }

  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam === "access_denied") {
    return loginError(origin, "google_denied");
  }
  if (errorParam) {
    return loginError(origin, "google_failed");
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code || !stateToken) {
    return loginError(origin, "google_failed");
  }

  const state = await verifyOAuthState(stateToken);
  if (!state) {
    return loginError(origin, "google_failed");
  }

  const codeVerifier = await consumePkceVerifierCookie();
  if (!codeVerifier) {
    return loginError(origin, "google_failed");
  }

  const redirectUri = googleCallbackUri(origin);
  const tokenResult = await exchangeGoogleCode({
    code,
    codeVerifier,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });

  if ("error" in tokenResult) {
    await logAuthEvent("GOOGLE_AUTH_FAILED", { reason: tokenResult.error });
    return loginError(origin, "google_failed");
  }

  const identity = await fetchGoogleUserInfo(tokenResult.accessToken);
  if (!identity) {
    return loginError(origin, "google_email_missing");
  }

  const resolved = await resolveGoogleSignIn(identity);

  if (resolved.status === "suspended") {
    return loginError(origin, "suspended");
  }
  if (resolved.status === "conflict") {
    return loginError(origin, "google_failed");
  }

  if (resolved.status === "ready") {
    if (!resolved.user.isVerified) {
      await createAndSendOtp(
        resolved.user.phone,
        "SIGNUP_VERIFY",
        resolved.user.countryCode,
        resolved.user.id,
      );
      const verify = new URL("/verify-otp", origin);
      verify.searchParams.set("phone", resolved.user.phone);
      verify.searchParams.set("purpose", "signup");
      verify.searchParams.set("country", resolved.user.countryCode);
      return NextResponse.redirect(verify);
    }

    const dest = await establishGoogleSession(resolved.user, state.returnTo);
    return NextResponse.redirect(new URL(dest, origin));
  }

  await setGooglePendingCookie({
    ...identity,
    resellerInvite: state.resellerInvite,
  });

  return NextResponse.redirect(new URL("/complete-phone", origin));
}
