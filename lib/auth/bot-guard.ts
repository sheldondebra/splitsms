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
  /libwww/i,
  /headless/i,
  /semrush/i,
  /ahrefs/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
];

/**
 * Detect known automation user-agents.
 * Missing/short UAs are NOT blocked — privacy browsers and some proxies strip
 * User-Agent, and treating that as a bot caused legitimate signup failures.
 */
export function isAutomatedUserAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return false;
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
