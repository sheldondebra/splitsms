import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  createPkcePair,
  fetchGoogleUserInfo,
  getGoogleClientCredentials,
  resolveGoogleOAuthOrigin,
} from "@/lib/auth/google";
import { GOOGLE_BASE_SCOPES } from "@/lib/google/scopes";
import { mergeScopes, parseScopeString } from "@/lib/google/connection-utils";

export const GOOGLE_CONNECT_PKCE_COOKIE = "splitsms_google_connect_pkce";

export type GoogleConnectState = {
  userId: string;
  returnTo?: string;
  requestedScopes: string[];
  nonce: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function cookieSecure() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    process.env.NODE_ENV === "production" &&
    (appUrl ? appUrl.startsWith("https://") : true)
  );
}

export function googleConnectCallbackUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/integrations/google/callback`;
}

export { createPkcePair, getGoogleClientCredentials, resolveGoogleOAuthOrigin, fetchGoogleUserInfo };

export async function signConnectState(payload: GoogleConnectState) {
  return new SignJWT({
    purpose: "google_connect_state",
    userId: payload.userId,
    returnTo: payload.returnTo ?? "",
    requestedScopes: payload.requestedScopes,
    nonce: payload.nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyConnectState(
  token: string,
): Promise<GoogleConnectState | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "google_connect_state") return null;
    const userId = String(payload.userId ?? "");
    const nonce = String(payload.nonce ?? "");
    if (!userId || !nonce) return null;
    const requestedScopes = Array.isArray(payload.requestedScopes)
      ? payload.requestedScopes.map(String)
      : [];
    return {
      userId,
      returnTo: payload.returnTo ? String(payload.returnTo) : undefined,
      requestedScopes,
      nonce,
    };
  } catch {
    return null;
  }
}

export function buildGoogleConnectAuthorizeUrl(opts: {
  state: string;
  codeChallenge: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  forceConsent: boolean;
}) {
  const scope = mergeScopes([...GOOGLE_BASE_SCOPES], opts.scopes).join(" ");
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope,
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: opts.forceConsent ? "consent" : "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleConnectCode(opts: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<
  | {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      scope?: string;
    }
  | { error: string }
> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: "authorization_code",
      code_verifier: opts.codeVerifier,
    }),
  });

  if (!res.ok) {
    return { error: "token_exchange" };
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!data.access_token) return { error: "token_exchange" };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

export async function refreshGoogleAccessToken(opts: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<
  | { accessToken: string; expiresIn?: number; scope?: string }
  | { error: string }
> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      refresh_token: opts.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    return { error: "token_refresh" };
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!data.access_token) return { error: "token_refresh" };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch {
    // best effort
  }
}

export async function setConnectPkceCookie(verifier: string) {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_CONNECT_PKCE_COOKIE, verifier, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function consumeConnectPkceCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const verifier = cookieStore.get(GOOGLE_CONNECT_PKCE_COOKIE)?.value ?? null;
  cookieStore.delete(GOOGLE_CONNECT_PKCE_COOKIE);
  return verifier;
}

export function newConnectNonce() {
  return randomBytes(16).toString("base64url");
}

export function scopeListFromTokenResponse(scope: string | undefined, fallback: string[]) {
  const parsed = parseScopeString(scope);
  return parsed.length > 0 ? parsed : fallback;
}

/** Stable fingerprint for tests / debugging — not a secret. */
export function hashSubjectHint(subject: string) {
  return createHash("sha256").update(subject).digest("hex").slice(0, 12);
}
