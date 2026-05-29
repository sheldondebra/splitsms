/** Shared mNotify HTTP helpers (no Prisma). */

export function trimApiKey(key: string) {
  return key.trim();
}

export function buildMnotifyUrl(baseUrl: string, path: string, apiKey: string) {
  const base = baseUrl.replace(/\/$/, "");
  let p = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && p.startsWith("/api/")) {
    p = p.slice(4);
  }
  return `${base}${p}?key=${encodeURIComponent(trimApiKey(apiKey))}`;
}

/** GET with mNotify auth (query key + Authorization header per official SDK). */
export async function mnotifyApiGet(baseUrl: string, path: string, apiKey: string) {
  const url = buildMnotifyUrl(baseUrl, path, apiKey);
  return fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: trimApiKey(apiKey),
    },
    cache: "no-store",
  });
}
