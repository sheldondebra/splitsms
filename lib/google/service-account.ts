import { createPrivateKey, createSign } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_READONLY = "https://www.googleapis.com/auth/spreadsheets.readonly";

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;

function serviceAccountCredentials() {
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey };
}

export function isGoogleServiceAccountConfigured() {
  return serviceAccountCredentials() != null;
}

function signJwt(email: string, pem: string, scope: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: email,
      scope,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const key = createPrivateKey(pem);
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(key).toString("base64url");
  return `${unsigned}.${signature}`;
}

export async function getGoogleServiceAccountAccessToken(
  scopes: string[] = [SHEETS_READONLY],
): Promise<string> {
  const creds = serviceAccountCredentials();
  if (!creds) {
    throw new Error("google_sa_missing");
  }
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const assertion = signJwt(creds.clientEmail, creds.privateKey, scopes.join(" "));
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "google_sa_token");
  }
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}
