/** Only allow official SplitSMS API hosts */
const ALLOWED_HOSTS = new Set(["www.splitsms.com", "splitsms.com"]);

export function isAllowedSplitSmsHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "www.splitsms.com" || h === "splitsms.com";
}

export function normalizeSplitSmsSiteUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!isAllowedSplitSmsHost(u.hostname)) {
      throw new Error("API must use splitsms.com");
    }
    return `${u.protocol}//${u.hostname}`;
  } catch {
    throw new Error("Invalid SplitSMS URL");
  }
}
