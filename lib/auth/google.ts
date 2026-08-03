import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const GOOGLE_PENDING_COOKIE = "splitsms_google_pending";
export const GOOGLE_PKCE_COOKIE = "splitsms_google_pkce";

export type GoogleIdentity = {
  googleId: string;
  email: string;
  fullName: string;
};

export type GoogleOAuthState = {
  returnTo?: string;
  resellerInvite?: string;
  nonce: string;
};

export type GooglePendingPayload = GoogleIdentity & {
  resellerInvite?: string;
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

export function getGoogleClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleCallbackUri(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function signOAuthState(payload: GoogleOAuthState) {
  return new SignJWT({
    returnTo: payload.returnTo ?? "",
    resellerInvite: payload.resellerInvite ?? "",
    nonce: payload.nonce,
    purpose: "google_oauth_state",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyOAuthState(token: string): Promise<GoogleOAuthState | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "google_oauth_state") return null;
    const nonce = String(payload.nonce ?? "");
    if (!nonce) return null;
    return {
      returnTo: payload.returnTo ? String(payload.returnTo) : undefined,
      resellerInvite: payload.resellerInvite
        ? String(payload.resellerInvite)
        : undefined,
      nonce,
    };
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizeUrl(opts: {
  state: string;
  codeChallenge: string;
  clientId: string;
  redirectUri: string;
}) {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(opts: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ accessToken: string } | { error: string }> {
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

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) return { error: "token_exchange" };
  return { accessToken: data.access_token };
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleIdentity | null> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
  };

  const googleId = String(data.sub ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  if (!googleId || !email) return null;
  if (data.email_verified === false) return null;

  const fullName =
    String(data.name ?? "").trim() || String(data.given_name ?? "").trim();

  return { googleId, email, fullName };
}

export async function setPkceVerifierCookie(verifier: string) {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_PKCE_COOKIE, verifier, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function consumePkceVerifierCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const verifier = cookieStore.get(GOOGLE_PKCE_COOKIE)?.value ?? null;
  cookieStore.delete(GOOGLE_PKCE_COOKIE);
  return verifier;
}

export async function setGooglePendingCookie(payload: GooglePendingPayload) {
  const token = await new SignJWT({
    purpose: "google_pending",
    googleId: payload.googleId,
    email: payload.email,
    fullName: payload.fullName,
    resellerInvite: payload.resellerInvite ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_PENDING_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
}

export async function getGooglePendingCookie(): Promise<GooglePendingPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GOOGLE_PENDING_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "google_pending") return null;
    const googleId = String(payload.googleId ?? "");
    const email = String(payload.email ?? "");
    if (!googleId || !email) return null;
    return {
      googleId,
      email,
      fullName: String(payload.fullName ?? ""),
      resellerInvite: payload.resellerInvite
        ? String(payload.resellerInvite)
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function clearGooglePendingCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_PENDING_COOKIE);
}

/** Pure helper for account-linking decisions (unit-tested). */
export function resolveGoogleAccountAction(input: {
  byGoogleId: { id: string } | null;
  byEmail: { id: string; googleId: string | null } | null;
}): "login_google" | "link_email" | "needs_phone" | "conflict" {
  if (input.byGoogleId) return "login_google";
  if (input.byEmail) {
    if (input.byEmail.googleId && input.byEmail.googleId.length > 0) {
      return "conflict";
    }
    return "link_email";
  }
  return "needs_phone";
}
