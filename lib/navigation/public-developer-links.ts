/**
 * Public equivalents of authenticated /developers/* routes.
 * Logged-out visitors should land on docs, not a login wall.
 */
export function publicDeveloperFallback(pathname: string): string | null {
  if (pathname === "/developers" || pathname === "/developers/") return "/docs";
  if (pathname === "/developers/docs" || pathname.startsWith("/developers/docs/")) {
    return "/docs";
  }
  if (pathname.startsWith("/developers/generate")) return "/vibe-coders";
  if (pathname.startsWith("/developers/prompts")) return "/vibe-coders";
  if (pathname.startsWith("/developers/postman")) return "/postman/splitsms.collection.json";
  if (pathname.startsWith("/developers/integrations")) return "/integrations";
  if (pathname.startsWith("/developers/webhooks")) return "/docs#webhooks";
  return null;
}
