import { cookies } from "next/headers";

const COOKIE_NAME = "splitsms_api_key_flash";
const MAX_AGE_SEC = 120;

export type ApiKeyFlash = { raw: string; keyId: string };

function cookieSecure() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return (
    process.env.NODE_ENV === "production" &&
    (appUrl ? appUrl.startsWith("https://") : true)
  );
}

function encodeFlash(flash: ApiKeyFlash): string {
  return `${flash.keyId}.${flash.raw}`;
}

function decodeFlash(value: string): ApiKeyFlash | null {
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const keyId = value.slice(0, dot).trim();
  const raw = value.slice(dot + 1).trim();
  if (!keyId || !raw.startsWith("sk_")) return null;
  return { keyId, raw };
}

export async function setApiKeyFlash(flash: ApiKeyFlash): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeFlash(flash), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/developers/api-keys",
    maxAge: MAX_AGE_SEC,
  });
}

/** Read-once: returns the new secret then clears the cookie. */
export async function consumeApiKeyFlash(): Promise<ApiKeyFlash | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/developers/api-keys",
    maxAge: 0,
  });
  return decodeFlash(value);
}
