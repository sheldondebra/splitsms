/** Fast bot / automation detection — no I/O. */

const BOT_UA_PATTERNS = [
  /bot\b/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /scrapy/i,
  /\bcurl\//i,
  /\bwget\//i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /libwww/i,
  /headless/i,
  /semrush/i,
  /ahrefs/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
];

/** Empty or very short user agents on auth POSTs are almost always scripts. */
export function isAutomatedUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim() ?? "";
  if (ua.length < 12) return true;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

/** Block scripted OTP / signup spam at the edge or route handler. */
export function shouldBlockAuthBot(
  userAgent: string | null | undefined,
  method = "POST",
): boolean {
  if (method !== "POST") return false;
  return isAutomatedUserAgent(userAgent);
}
