import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  consumePkceVerifierCookie,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  getGoogleClientCredentials,
  googleCallbackUri,
  setGooglePendingCookie,
  verifyOAuthState,
} from "@/lib/auth/google";
import {
  establishGoogleSession,
  resolveGoogleSignIn,
} from "@/lib/auth/google-login";
import { logAuthEvent } from "@/lib/auth/audit";
import { createAndSendOtp } from "@/lib/auth/otp";

function loginError(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

export async function GET(request: NextRequest) {
  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    return loginError(request, "google_config");
  }

  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam === "access_denied") {
    return loginError(request, "google_denied");
  }
  if (errorParam) {
    return loginError(request, "google_failed");
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateToken = request.nextUrl.searchParams.get("state");
  if (!code || !stateToken) {
    return loginError(request, "google_failed");
  }

  const state = await verifyOAuthState(stateToken);
  if (!state) {
    return loginError(request, "google_failed");
  }

  const codeVerifier = await consumePkceVerifierCookie();
  if (!codeVerifier) {
    return loginError(request, "google_failed");
  }

  const redirectUri = googleCallbackUri(request.nextUrl.origin);
  const tokenResult = await exchangeGoogleCode({
    code,
    codeVerifier,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });

  if ("error" in tokenResult) {
    await logAuthEvent("GOOGLE_AUTH_FAILED", { reason: tokenResult.error });
    return loginError(request, "google_failed");
  }

  const identity = await fetchGoogleUserInfo(tokenResult.accessToken);
  if (!identity) {
    return loginError(request, "google_email_missing");
  }

  const resolved = await resolveGoogleSignIn(identity);

  if (resolved.status === "suspended") {
    return loginError(request, "suspended");
  }
  if (resolved.status === "conflict") {
    return loginError(request, "google_failed");
  }

  if (resolved.status === "ready") {
    if (!resolved.user.isVerified) {
      await createAndSendOtp(
        resolved.user.phone,
        "SIGNUP_VERIFY",
        resolved.user.countryCode,
        resolved.user.id,
      );
      const verify = new URL("/verify-otp", request.url);
      verify.searchParams.set("phone", resolved.user.phone);
      verify.searchParams.set("purpose", "signup");
      verify.searchParams.set("country", resolved.user.countryCode);
      return NextResponse.redirect(verify);
    }

    const dest = await establishGoogleSession(resolved.user, state.returnTo);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  await setGooglePendingCookie({
    ...identity,
    resellerInvite: state.resellerInvite,
  });

  return NextResponse.redirect(new URL("/complete-phone", request.url));
}
