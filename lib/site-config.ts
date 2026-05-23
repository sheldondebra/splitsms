import raw from "@/config/site.json";

export type SiteConfig = typeof raw;

const config: SiteConfig = raw;

/** Canonical production URL (www). Override with NEXT_PUBLIC_APP_URL in env. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return fromEnv || config.siteUrl.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return getSiteUrl();
}

export function getApiV1Url(path = ""): string {
  const base = getApiBaseUrl();
  const prefix = config.apiPathPrefix.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${prefix}${p}`;
}

export const siteName = config.siteName;
export const supportEmail = config.supportEmail;

export const wordpressPlugin = {
  ...config.wordpressPlugin,
  get downloadUrl() {
    return `${getSiteUrl()}${config.wordpressPlugin.downloadPath}`;
  },
  get updateCheckUrl() {
    return `${getSiteUrl()}${config.wordpressPlugin.updateCheckPath}`;
  },
  get docsUrl() {
    return `${getSiteUrl()}/integrations`;
  },
  get apiDocsUrl() {
    return `${getSiteUrl()}/api-docs`;
  },
};

export { config as siteConfig };
